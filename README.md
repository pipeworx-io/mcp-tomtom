# mcp-tomtom

TomTom MCP — wraps the TomTom Search & Routing APIs (api.tomtom.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/tomtom/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Tomtom data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/tomtom_geocode \
  -H 'Content-Type: application/json' \
  -d '{"query":"350 5th Ave, New York"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/tomtom_geocode`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
