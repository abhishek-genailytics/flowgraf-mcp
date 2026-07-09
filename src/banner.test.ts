import { describe, expect, it } from "vitest";

import { BANNER } from "./banner";

describe("flowgraf-mcp wiring", () => {
  it("is wired into the workspace", () => {
    expect(BANNER).toContain("flowgraf-mcp");
  });
});
