# mcp-tomtom

TomTom MCP — wraps the TomTom Search & Routing APIs (api.tomtom.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `geocode` | Geocoding: convert an address, place name, or free-text location query into geographic coordinates (latitude/longitude). Returns formatted address, country, lat, lon, type, and match score. Example: geocode({ query: "350 5th Ave, New York" }) |
| `search_poi` | Search for points of interest (POIs) — businesses, landmarks, restaurants, gas stations, etc. — by name or category, optionally near a lat/lon center within a radius. Returns name, category, address, coordinates, phone, url, and distance. Example: search_poi({ query: "coffee", lat: 40.748, lon: -73.985, radius: 1000 }) |
| `reverse_geocode` | Reverse geocoding: convert latitude/longitude coordinates into a human-readable street address. Returns the freeform address, country, municipality, street name, postal code, and position. Example: reverse_geocode({ lat: 40.748, lon: -73.985 }) |
| `route` | Traffic-aware routing / directions: calculate the best route between two points and return distance plus travel time computed with live traffic. Reports traffic delay so you get realistic ETAs, not free-flow estimates. Supports car, truck, pedestrian, and bicycle travel modes. Example: route({ from_lat: 40.748, from_lon: -73.985, to_lat: 40.689, to_lon: -74.044 }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "tomtom": {
      "url": "https://gateway.pipeworx.io/tomtom/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Tomtom data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
