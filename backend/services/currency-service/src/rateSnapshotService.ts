import Decimal from 'decimal.js';
import { getLatestRates } from './openexchange-service';
import prisma from '../../../common/prisma';
import { cacheService, initRedis } from '../../../common/redis';

const PROVIDER = 'openexchangerates';
const DEFAULT_BASE = 'USD';

const MAX_STALENESS_SECONDS = parseInt(process.env.FX_MAX_STALENESS_SECONDS || '120', 10);
const MAX_VOLATILITY_PCT = parseFloat(process.env.FX_MAX_VOLATILITY_PCT || '5');
const SNAPSHOT_CACHE_TTL_SECONDS = parseInt(process.env.FX_SNAPSHOT_CACHE_TTL_SECONDS || '300', 10);

const LATEST_SNAPSHOT_KEY = 'fx:latest_snapshot_id';

type RatesMap = Record<string, number | string>;

function toDecimal(value: number | string): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

function percentChange(current: Decimal, previous: Decimal): Decimal {
  if (previous.isZero()) return new Decimal(0);
  return current.minus(previous).abs().div(previous).mul(100);
}

export function getCrossRateFromSnapshot(snapshot: { baseCurrency: string; ratesJson: RatesMap }, from: string, to: string): Decimal {
  if (from === to) return new Decimal(1);

  const rates = snapshot.ratesJson;
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) {
    throw new Error(`Currency ${from} or ${to} not found in snapshot rates`);
  }

  const fromDecimal = toDecimal(fromRate);
  const toDecimalRate = toDecimal(toRate);

  return toDecimalRate.div(fromDecimal);
}

export class RateSnapshotService {
  constructor() {
    initRedis();
  }

  async ingestLatestSnapshot(): Promise<{ id: string; status: 'ACCEPTED' | 'REJECTED'; rejectReason?: string }> {
    const fetchedAt = new Date();
    const latest = await getLatestRates(DEFAULT_BASE);
    const providerTimestamp = new Date(latest.timestamp * 1000);
    const normalizedRates: Record<string, string> = {};

    for (const [currency, rate] of Object.entries(latest.rates)) {
      normalizedRates[currency] = rate.toString();
    }

    const stalenessSeconds = Math.floor((fetchedAt.getTime() - providerTimestamp.getTime()) / 1000);
    if (stalenessSeconds > MAX_STALENESS_SECONDS) {
      const rejected = await prisma.fxRateSnapshot.create({
        data: {
          provider: PROVIDER,
          baseCurrency: latest.base,
          providerTimestamp,
          fetchedAt,
          ratesJson: normalizedRates,
          status: 'REJECTED',
          rejectReason: `stale_snapshot_${stalenessSeconds}s`,
        },
      });
      return { id: rejected.id, status: 'REJECTED', rejectReason: rejected.rejectReason || undefined };
    }

    const previous = await prisma.fxRateSnapshot.findFirst({
      where: { provider: PROVIDER, status: 'ACCEPTED' },
      orderBy: { fetchedAt: 'desc' },
    });

    if (previous?.ratesJson) {
      const previousRates = previous.ratesJson as RatesMap;
      let maxChange = new Decimal(0);
      for (const [currency, rate] of Object.entries(latest.rates)) {
        const previousRate = previousRates[currency];
        if (!previousRate) continue;
        const change = percentChange(toDecimal(rate), toDecimal(previousRate));
        if (change.greaterThan(maxChange)) {
          maxChange = change;
        }
      }

      if (maxChange.greaterThan(MAX_VOLATILITY_PCT)) {
        const rejected = await prisma.fxRateSnapshot.create({
          data: {
            provider: PROVIDER,
            baseCurrency: latest.base,
            providerTimestamp,
            fetchedAt,
            ratesJson: normalizedRates,
            status: 'REJECTED',
            rejectReason: `volatility_${maxChange.toFixed(4)}pct`,
          },
        });
        return { id: rejected.id, status: 'REJECTED', rejectReason: rejected.rejectReason || undefined };
      }
    }

    const accepted = await prisma.fxRateSnapshot.create({
      data: {
        provider: PROVIDER,
        baseCurrency: latest.base,
        providerTimestamp,
        fetchedAt,
        ratesJson: normalizedRates,
        status: 'ACCEPTED',
      },
    });

    await cacheService.set(LATEST_SNAPSHOT_KEY, accepted.id, SNAPSHOT_CACHE_TTL_SECONDS);
    await cacheService.set(`fx:rates:${accepted.id}`, accepted.ratesJson, SNAPSHOT_CACHE_TTL_SECONDS);

    return { id: accepted.id, status: 'ACCEPTED' };
  }

  async getLatestAcceptedSnapshot(): Promise<any> {
    const cachedId = await cacheService.get<string>(LATEST_SNAPSHOT_KEY);
    if (cachedId) {
      const cachedSnapshot = await prisma.fxRateSnapshot.findUnique({ where: { id: cachedId } });
      if (cachedSnapshot) return cachedSnapshot;
    }

    const snapshot = await prisma.fxRateSnapshot.findFirst({
      where: { provider: PROVIDER, status: 'ACCEPTED' },
      orderBy: { fetchedAt: 'desc' },
    });

    if (!snapshot) {
      throw new Error('No accepted FX rate snapshot available');
    }

    await cacheService.set(LATEST_SNAPSHOT_KEY, snapshot.id, SNAPSHOT_CACHE_TTL_SECONDS);
    return snapshot;
  }

  async getLatestSnapshotForQuote(): Promise<any> {
    const snapshot = await this.getLatestAcceptedSnapshot();
    const ageSeconds = Math.floor((Date.now() - new Date(snapshot.fetchedAt).getTime()) / 1000);
    if (ageSeconds > MAX_STALENESS_SECONDS) {
      throw new Error(`Rates temporarily unavailable (snapshot age ${ageSeconds}s)`);
    }
    return snapshot;
  }
}

export const rateSnapshotService = new RateSnapshotService();
