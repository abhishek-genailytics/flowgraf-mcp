/**
 * flowgraf-mcp — stdio entrypoint. Connects a remote MCP `Client` (Streamable HTTP) to
 * the hosted `/api/mcp` endpoint, then serves a local stdio server that forwards
 * every request to it. Run: `pnpm --filter flowgraf-mcp dev` (targets prod by default;
 * override with `FLOWGRAF_MCP_URL` or `FLOWGRAF_MCP_BASE_URL`, e.g. http://localhost:3000).
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { banner } from "./banner";
import { createProxyServer, resolveRemoteUrl, type RemoteClient } from "./proxy";

async function main(): Promise<void> {
  const remoteUrl = resolveRemoteUrl();
  // Banner + all logs go to stderr; stdout is reserved for the MCP protocol.
  console.error(banner(remoteUrl));

  const client = new Client({ name: "flowgraf-proxy-client", version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(remoteUrl)));

  // Adapt the SDK client to the proxy's RemoteClient port. `callTool`'s default
  // result type is the backwards-compat union (it may carry a legacy `toolResult`
  // instead of `content`); modern servers always return `content`, so we narrow it.
  const remote: RemoteClient = {
    listTools: (params) => client.listTools(params),
    callTool: (params) => client.callTool(params) as Promise<CallToolResult>,
  };
  const server = createProxyServer(remote);
  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error("[flowgraf-mcp] fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
