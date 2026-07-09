# flowgraf-mcp

**Create and edit clean, editable architecture diagrams from your AI agent.**

[Flowgraf](https://flowgraf.in) turns a description of a system into a clean,
auto-laid-out architecture diagram — and hands back a link to a live canvas you can
keep editing (by chat or by hand). This package is the **stdio proxy** for MCP clients
that speak stdio; it forwards to Flowgraf's hosted MCP endpoint. No API key, no LLM cost
to you — your agent authors the diagram, Flowgraf lays it out and renders it.

## Tools

| Tool | What it does |
|------|--------------|
| `create_diagram` | Turn a graph (nodes + edges + groups) into a diagram → returns an SVG, a Mermaid string, and a `/d/<id>` canvas link |
| `edit_diagram` | Apply operations to an existing diagram (e.g. insert a cache between two nodes) — it re-wires and re-lays-out automatically |
| `get_diagram` | Fetch a diagram's current graph + version |

## Install

### Claude Code

Recommended — the hosted **remote** endpoint (no local process):

```bash
claude mcp add --transport http flowgraf https://flowgraf.in/api/mcp
```

Or via this **stdio** proxy:

```bash
claude mcp add flowgraf npx flowgraf-mcp
```

### Cursor / Windsurf (stdio)

Add to your MCP config (`~/.cursor/mcp.json` for Cursor):

```json
{
  "mcpServers": {
    "flowgraf": {
      "command": "npx",
      "args": ["-y", "flowgraf-mcp"]
    }
  }
}
```

### Anything else

```bash
npx -y flowgraf-mcp
```

The proxy talks the [Model Context Protocol](https://modelcontextprotocol.io) over stdio
and forwards to the hosted API.

## Configuration

By default the proxy targets Flowgraf's hosted endpoint. Override it (e.g. for local
development) with an environment variable:

| Variable | Meaning |
|----------|---------|
| `FLOWGRAF_MCP_URL` | Full endpoint URL, e.g. `http://localhost:3000/api/mcp` |
| `FLOWGRAF_MCP_BASE_URL` | Base URL; `/api/mcp` is appended |

## Example

> "Create an architecture diagram: a user hits an API gateway in a VPC, which talks to a
> Postgres database." → `create_diagram` returns an SVG and a link like
> `https://flowgraf.in/d/abc123`. Open it to edit on the canvas.
>
> "Add a Redis cache between the API and the database." → `edit_diagram` inserts the cache
> and re-routes the edge automatically — no manual cleanup.

## Links

- Website: <https://flowgraf.in>
- MCP endpoint: `https://flowgraf.in/api/mcp`

## License

MIT
