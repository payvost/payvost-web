import { Country, State } from 'country-state-city';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const normalize = (value: string) => value.trim().toLowerCase();

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
  const requestedIso: string = String(payload?.countryIso || payload?.country || '').trim();
  const requestedName: string = String(payload?.countryName || '').trim();
  const requestedIso3: string = String(payload?.countryIso3 || '').trim();

    if (!requestedIso && !requestedName) {
      return NextResponse.json(
        { error: 'countryIso or countryName is required' },
        { status: 400 }
      );
    }

    const countries = Country.getAllCountries();
    const normalizedIso = requestedIso.length === 2 ? requestedIso.toUpperCase() : '';

    let countryMatch = normalizedIso
      ? Country.getCountryByCode(normalizedIso)
      : undefined;

    if (!countryMatch && requestedName) {
      const targetName = normalize(requestedName);
      countryMatch = countries.find((country) => normalize(country.name) === targetName);
    }

    if (!countryMatch) {
      return NextResponse.json(
        {
          error: true,
          msg: 'Country not supported',
          data: { states: [] },
        },
        { status: 404 }
      );
    }

    const states = State.getStatesOfCountry(countryMatch.isoCode) || [];

    const mappedStates = states
      .filter((state) => Boolean(state?.name))
      .map((state) => ({
        name: state.name,
        state_code: state.isoCode,
        isoCode: state.isoCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const iso3 = requestedIso3 || countryMatch.isoCode;

    return NextResponse.json(
      {
        error: false,
        msg: 'States retrieved',
        data: {
          name: countryMatch.name,
          iso2: countryMatch.isoCode,
          iso3,
          states: mappedStates,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    console.error('State lookup error', error);
    return NextResponse.json(
      { error: 'Unexpected error requesting states' },
      { status: 500 }
    );
  }
}
