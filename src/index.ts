interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * TomTom MCP — wraps the TomTom Search & Routing APIs (api.tomtom.com)
 *
 * Tools:
 * - geocode: turn an address / place string into coordinates (geocoding)
 * - search_poi: search for points of interest (POIs) near a location
 * - reverse_geocode: turn lat/lon coordinates into a street address
 * - route: traffic-aware routing / directions with live travel time
 *
 * Dual-key model: pass your own TomTom key via the optional `_apiKey`
 * parameter for higher limits, or omit it to use the shared Pipeworx key.
 * The key is sent as the `key` query parameter. TomTom puts the query
 * itself IN THE PATH (e.g. /search/2/geocode/{query}.json), so the query
 * segment is URL-encoded.
 */


const BASE_URL = 'https://api.tomtom.com';

const OPTIONAL_KEY = {
  type: 'string',
  description:
    'Optional — your own TomTom API key for higher limits; omit to use the shared Pipeworx key.',
} as const;

const tools: McpToolExport['tools'] = [
  {
    name: 'geocode',
    description:
      'Geocoding: convert an address, place name, or free-text location query into geographic coordinates (latitude/longitude). Returns formatted address, country, lat, lon, type, and match score. Example: geocode({ query: "350 5th Ave, New York" })',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Address or place to geocode, e.g. "350 5th Ave, New York" or "Eiffel Tower"',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 5)',
        },
        _apiKey: OPTIONAL_KEY,
      },
      required: ['query'],
    },
  },
  {
    name: 'search_poi',
    description:
      'Search for points of interest (POIs) — businesses, landmarks, restaurants, gas stations, etc. — by name or category, optionally near a lat/lon center within a radius. Returns name, category, address, coordinates, phone, url, and distance. Example: search_poi({ query: "coffee", lat: 40.748, lon: -73.985, radius: 1000 })',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'POI search term, e.g. "coffee", "pizza", "gas station", "Starbucks"',
        },
        lat: {
          type: 'number',
          description: 'Optional latitude of the search center to bias/limit results',
        },
        lon: {
          type: 'number',
          description: 'Optional longitude of the search center to bias/limit results',
        },
        radius: {
          type: 'number',
          description: 'Optional search radius in meters (only used when lat/lon are provided)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 10)',
        },
        _apiKey: OPTIONAL_KEY,
      },
      required: ['query'],
    },
  },
  {
    name: 'reverse_geocode',
    description:
      'Reverse geocoding: convert latitude/longitude coordinates into a human-readable street address. Returns the freeform address, country, municipality, street name, postal code, and position. Example: reverse_geocode({ lat: 40.748, lon: -73.985 })',
    inputSchema: {
      type: 'object',
      properties: {
        lat: {
          type: 'number',
          description: 'Latitude of the point to reverse geocode',
        },
        lon: {
          type: 'number',
          description: 'Longitude of the point to reverse geocode',
        },
        _apiKey: OPTIONAL_KEY,
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'route',
    description:
      'Traffic-aware routing / directions: calculate the best route between two points and return distance plus travel time computed with live traffic. Reports traffic delay so you get realistic ETAs, not free-flow estimates. Supports car, truck, pedestrian, and bicycle travel modes. Example: route({ from_lat: 40.748, from_lon: -73.985, to_lat: 40.689, to_lon: -74.044 })',
    inputSchema: {
      type: 'object',
      properties: {
        from_lat: { type: 'number', description: 'Origin latitude' },
        from_lon: { type: 'number', description: 'Origin longitude' },
        to_lat: { type: 'number', description: 'Destination latitude' },
        to_lon: { type: 'number', description: 'Destination longitude' },
        travel_mode: {
          type: 'string',
          enum: ['car', 'truck', 'pedestrian', 'bicycle'],
          description: 'Travel mode for traffic-aware routing (default "car")',
        },
        _apiKey: OPTIONAL_KEY,
      },
      required: ['from_lat', 'from_lon', 'to_lat', 'to_lon'],
    },
  },
];

// TomTom returns non-2xx with a plain-text or JSON error body. Surface the
// status + body text rather than swallowing it.
async function tomtomGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const text = await res.text();
    return { error: res.status, message: text };
  }
  return res.json();
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  if (!apiKey) {
    return { error: 'api_key_required', message: 'No TomTom key available.' };
  }

  switch (name) {
    case 'geocode':
      return geocode(args.query as string, (args.limit as number) ?? 5, apiKey);
    case 'search_poi':
      return searchPoi(
        args.query as string,
        args.lat as number | undefined,
        args.lon as number | undefined,
        args.radius as number | undefined,
        (args.limit as number) ?? 10,
        apiKey,
      );
    case 'reverse_geocode':
      return reverseGeocode(args.lat as number, args.lon as number, apiKey);
    case 'route':
      return route(
        args.from_lat as number,
        args.from_lon as number,
        args.to_lat as number,
        args.to_lon as number,
        (args.travel_mode as string) ?? 'car',
        apiKey,
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function geocode(query: string, limit: number, apiKey: string) {
  const params = new URLSearchParams({ key: apiKey, limit: String(limit) });
  const path = `/search/2/geocode/${encodeURIComponent(query)}.json?${params}`;
  const data = (await tomtomGet(path)) as {
    error?: unknown;
    results?: Array<{
      type?: string;
      score?: number;
      address?: { freeformAddress?: string; country?: string };
      position?: { lat?: number; lon?: number };
    }>;
  };
  if (data.error !== undefined) return data;

  return {
    results: (data.results ?? []).map((r) => ({
      formatted: r.address?.freeformAddress,
      country: r.address?.country,
      lat: r.position?.lat,
      lon: r.position?.lon,
      type: r.type,
      score: r.score,
    })),
  };
}

async function searchPoi(
  query: string,
  lat: number | undefined,
  lon: number | undefined,
  radius: number | undefined,
  limit: number,
  apiKey: string,
) {
  const params = new URLSearchParams({ key: apiKey, limit: String(limit) });
  if (lat !== undefined && lon !== undefined) {
    params.set('lat', String(lat));
    params.set('lon', String(lon));
    if (radius !== undefined) params.set('radius', String(radius));
  }
  const path = `/search/2/poiSearch/${encodeURIComponent(query)}.json?${params}`;
  const data = (await tomtomGet(path)) as {
    error?: unknown;
    results?: Array<{
      dist?: number;
      poi?: { name?: string; categories?: string[]; phone?: string; url?: string };
      address?: { freeformAddress?: string };
      position?: { lat?: number; lon?: number };
    }>;
  };
  if (data.error !== undefined) return data;

  return {
    results: (data.results ?? []).map((r) => ({
      name: r.poi?.name,
      category: r.poi?.categories,
      formatted: r.address?.freeformAddress,
      lat: r.position?.lat,
      lon: r.position?.lon,
      phone: r.poi?.phone,
      url: r.poi?.url,
      distance: r.dist,
    })),
  };
}

async function reverseGeocode(lat: number, lon: number, apiKey: string) {
  const params = new URLSearchParams({ key: apiKey });
  const path = `/search/2/reverseGeocode/${lat},${lon}.json?${params}`;
  const data = (await tomtomGet(path)) as {
    error?: unknown;
    addresses?: Array<{
      address?: {
        freeformAddress?: string;
        country?: string;
        municipality?: string;
        streetName?: string;
        postalCode?: string;
      };
      position?: string;
    }>;
  };
  if (data.error !== undefined) return data;

  const first = data.addresses?.[0];
  const a = first?.address ?? {};
  return {
    freeformAddress: a.freeformAddress,
    country: a.country,
    municipality: a.municipality,
    streetName: a.streetName,
    postalCode: a.postalCode,
    position: first?.position,
  };
}

async function route(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  travelMode: string,
  apiKey: string,
) {
  const params = new URLSearchParams({ key: apiKey, travelMode, traffic: 'true' });
  const path = `/routing/1/calculateRoute/${fromLat},${fromLon}:${toLat},${toLon}/json?${params}`;
  const data = (await tomtomGet(path)) as {
    error?: unknown;
    routes?: Array<{
      summary?: {
        lengthInMeters?: number;
        travelTimeInSeconds?: number;
        trafficDelayInSeconds?: number;
        departureTime?: string;
        arrivalTime?: string;
      };
    }>;
  };
  if (data.error !== undefined) return data;

  const summary = data.routes?.[0]?.summary ?? {};
  return {
    distance_m: summary.lengthInMeters,
    travel_time_s: summary.travelTimeInSeconds,
    traffic_delay_s: summary.trafficDelayInSeconds,
    departure: summary.departureTime,
    arrival: summary.arrivalTime,
    travel_mode: travelMode,
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
