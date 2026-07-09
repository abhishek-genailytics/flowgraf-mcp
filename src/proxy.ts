/**
 * The stdio proxy — a thin, transparent forwarder with ZERO business logic.
 *
 * A local stdio MCP server whose only job is to pass MCP requests through to the
 * hosted HTTP endpoint (`/api/mcp`). It does not know what the tools do, does not
 * validate graphs, does not convert anything: `tools/list` and `tools/call` are
 * forwarded verbatim to a remote MCP `Client`, and whatever the remote returns is
 * handed back. Because it forwards the remote's own tool list, the proxy is always
 * in sync with the three tools the server exposes — nothing to keep updated here.
 *
 * This exists for stdio-only clients; clients that speak Streamable HTTP should
 * connect to `/api/mcp` directly and skip the proxy entirely.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type CallToolResult,
  type ListToolsRequest,
  type ListToolsResult,
} from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_REMOTE = "https://flowgraf.in/api/mcp";

/** The two remote calls the proxy forwards. Structurally satisfied by the SDK `Client`. */
export interface RemoteClient {
  listTools(params?: ListToolsRequest["params"]): Promise<ListToolsResult>;
  callTool(params: CallToolRequest["params"]): Promise<CallToolResult>;
}

/**
 * Resolve the hosted endpoint from the environment. `FLOWGRAF_MCP_URL` is the full
 * endpoint URL; absent it, `FLOWGRAF_MCP_BASE_URL` + `/api/mcp`; absent both, prod.
 */
export function resolveRemoteUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.FLOWGRAF_MCP_URL) return env.FLOWGRAF_MCP_URL;
  if (env.FLOWGRAF_MCP_BASE_URL) return `${env.FLOWGRAF_MCP_BASE_URL.replace(/\/+$/, "")}/api/mcp`;
  return DEFAULT_REMOTE;
}

/** Forward a tools/list straight to the remote. */
export function forwardListTools(
  client: RemoteClient,
  params?: ListToolsRequest["params"],
): Promise<ListToolsResult> {
  return client.listTools(params);
}

/** Forward a tools/call straight to the remote (name + arguments unchanged). */
export function forwardCallTool(
  client: RemoteClient,
  params: CallToolRequest["params"],
): Promise<CallToolResult> {
  return client.callTool(params);
}

/**
 * Build the local stdio-facing server, wiring its two request handlers to forward
 * to `client`. Kept separate from transport/connection so it is unit-testable.
 */
export function createProxyServer(client: RemoteClient): Server {
  const server = new Server(
    { name: "flowgraf-proxy", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, (req) => forwardListTools(client, req.params));
  server.setRequestHandler(CallToolRequestSchema, (req) => forwardCallTool(client, req.params));
  return server;
}
