# Dockerfile for the flowgraf-mcp stdio proxy.
#
# Used by MCP directories (e.g. Glama) to build the server and inspect its tools.
# NOTE: the proxy is a transparent forwarder — at startup it connects to Flowgraf's
# hosted endpoint (https://flowgraf.in/api/mcp) and forwards `tools/list`/`tools/call`
# over stdio. The running container therefore needs OUTBOUND NETWORK ACCESS to
# flowgraf.in for tool enumeration to succeed.
#
# Build:  docker build -t flowgraf-mcp .
# Run:    docker run --rm -i flowgraf-mcp        # speaks MCP over stdio

# ---- build: compile the bundle ------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
# package.json always matches; package-lock.json is copied too when present.
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime: prod deps + bundle only -----------------------------------------
# esbuild builds with `--packages=external`, so the bundle resolves its single
# runtime dependency (@modelcontextprotocol/sdk) from node_modules at run time.
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist

# stdout is the MCP channel; the banner and all logs go to stderr.
ENTRYPOINT ["node", "dist/index.js"]
