/**
 * Boot banner for the stdio proxy. Printed to stderr (stdout is reserved for the
 * MCP protocol). Shows which hosted API the proxy forwards to.
 */
export function banner(remoteUrl: string): string {
  return `[flowgraf-mcp] stdio proxy → ${remoteUrl}  (forwarding create_diagram / edit_diagram / get_diagram)`;
}

/** Static marker kept for the workspace-wiring smoke test. */
export const BANNER = "[flowgraf-mcp] stdio proxy";
