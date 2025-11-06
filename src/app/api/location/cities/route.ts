import { City, Country, State } from 'country-state-city';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const normalize = (value: string) => value.trim().toLowerCase();

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const requestedIso: string = String(payload?.countryIso || payload?.country || '').trim();
    const requestedName: string = String(payload?.countryName || '').trim();
    const stateName: string = String(payload?.stateName || payload?.state || '').trim();
    const stateCode: string = String(payload?.stateCode || '').trim();

    if (!requestedIso && !requestedName) {
      return NextResponse.json(
        { error: 'countryIso or countryName is required' },
        { status: 400 }
      );
    }

    if (!stateName && !stateCode) {
      return NextResponse.json(
        { error: 'stateName or stateCode is required' },
        { status: 400 }
      );
    }

    const normalizedIso = requestedIso.length === 2 ? requestedIso.toUpperCase() : '';
    const countries = Country.getAllCountries();

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
          data: [],
        },
        { status: 404 }
      );
    }

    const states = State.getStatesOfCountry(countryMatch.isoCode) || [];

    let stateMatch = stateCode
      ? states.find(
          (state) =>
            typeof state.isoCode === 'string' &&
            normalize(state.isoCode) === normalize(stateCode)
        )
      : undefined;

    if (!stateMatch && stateName) {
      const targetStateName = normalize(stateName);
      stateMatch = states.find(
        (state) => typeof state.name === 'string' && normalize(state.name) === targetStateName
      );
    }

    if (!stateMatch) {
      return NextResponse.json(
        {
          error: true,
          msg: 'State not supported',
          data: [],
        },
        { status: 404 }
      );
    }

    const cities = City.getCitiesOfState(countryMatch.isoCode, stateMatch.isoCode) || [];

    const mappedCities = cities
      .filter((city) => Boolean(city?.name))
      .map((city) => city.name)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json(
      {
        error: false,
        msg: 'Cities retrieved',
        data: mappedCities,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    console.error('City lookup error', error);
    return NextResponse.json(
      { error: 'Unexpected error requesting cities' },
      { status: 500 }
    );
  }
}
