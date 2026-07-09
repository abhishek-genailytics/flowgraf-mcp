import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
} from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";

import {
  createProxyServer,
  forwardCallTool,
  forwardListTools,
  resolveRemoteUrl,
  type RemoteClient,
} from "./proxy";

/** A fake hosted endpoint: records what it was asked and returns canned results. */
class FakeRemote implements RemoteClient {
  listCalls: Array<ListToolsRequest["params"] | undefined> = [];
  callCalls: Array<CallToolRequest["params"]> = [];
  tools: ListToolsResult = {
    tools: [
      { name: "create_diagram", description: "c", inputSchema: { type: "object" } },
      { name: "edit_diagram", description: "e", inputSchema: { type: "object" } },
      { name: "get_diagram", description: "g", inputSchema: { type: "object" } },
    ],
  };
  async listTools(params?: ListToolsRequest["params"]): Promise<ListToolsResult> {
    this.listCalls.push(params);
    return this.tools;
  }
  async callTool(params: CallToolRequest["params"]): Promise<CallToolResult> {
    this.callCalls.push(params);
    return { content: [{ type: "text", text: `echo:${params.name}` }] };
  }
}

describe("resolveRemoteUrl", () => {
  it("defaults to the prod endpoint", () => {
    expect(resolveRemoteUrl({})).toBe("https://flowgraf.in/api/mcp");
  });
  it("honors a full FLOWGRAF_MCP_URL", () => {
    expect(resolveRemoteUrl({ FLOWGRAF_MCP_URL: "http://localhost:3000/api/mcp" })).toBe(
      "http://localhost:3000/api/mcp",
    );
  });
  it("appends /api/mcp to FLOWGRAF_MCP_BASE_URL (trailing slash tolerant)", () => {
    expect(resolveRemoteUrl({ FLOWGRAF_MCP_BASE_URL: "http://localhost:3000/" })).toBe(
      "http://localhost:3000/api/mcp",
    );
  });
});

describe("forwarders pass through verbatim (zero business logic)", () => {
  it("forwardListTools returns the remote list unchanged", async () => {
    const remote = new FakeRemote();
    const res = await forwardListTools(remote, { cursor: "c1" });
    expect(res).toBe(remote.tools);
    expect(remote.listCalls).toEqual([{ cursor: "c1" }]);
  });
  it("forwardCallTool passes name + arguments through untouched", async () => {
    const remote = new FakeRemote();
    const params = { name: "edit_diagram", arguments: { diagramId: "d1", baseVersion: 2, ops: [] } };
    const res = await forwardCallTool(remote, params);
    expect(res.content).toEqual([{ type: "text", text: "echo:edit_diagram" }]);
    expect(remote.callCalls).toEqual([params]);
  });
});

describe("createProxyServer over a real in-process MCP connection", () => {
  it("forwards a downstream client's list + call to the remote", async () => {
    const remote = new FakeRemote();
    const server = createProxyServer(remote);
    const client = new Client({ name: "downstream", version: "0.0.0" });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverT), client.connect(clientT)]);

    const listed = await client.listTools();
    expect(listed.tools.map((t) => t.name)).toEqual(["create_diagram", "edit_diagram", "get_diagram"]);

    const called = await client.callTool({ name: "create_diagram", arguments: { title: "X" } });
    expect((called.content as Array<{ text: string }>)[0]!.text).toBe("echo:create_diagram");
    expect(remote.callCalls[0]).toMatchObject({ name: "create_diagram", arguments: { title: "X" } });
  });
});
