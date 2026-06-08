# syntax=docker/dockerfile:1.20
FROM node:lts-trixie-slim AS base
ARG USER_UID=1000
ARG USER_GID=1000
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates gosu curl gh git wget ripgrep python3 \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

# Modify the existing node user/group to have the specified UID/GID to match host user
RUN usermod -u $USER_UID --non-unique node \
  && groupmod -g $USER_GID --non-unique node \
  && usermod -g $USER_GID -d /paperclip node

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY cli/package.json cli/
COPY server/package.json server/
COPY ui/package.json ui/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/adapter-utils/package.json packages/adapter-utils/
COPY packages/mcp-server/package.json packages/mcp-server/
<<<<<<< HEAD
=======
COPY packages/skills-catalog/package.json packages/skills-catalog/
COPY packages/teams-catalog/package.json packages/teams-catalog/
>>>>>>> upstream/master
COPY packages/adapters/acpx-local/package.json packages/adapters/acpx-local/
COPY packages/adapters/claude-local/package.json packages/adapters/claude-local/
COPY packages/adapters/codex-local/package.json packages/adapters/codex-local/
COPY packages/adapters/cursor-cloud/package.json packages/adapters/cursor-cloud/
COPY packages/adapters/cursor-local/package.json packages/adapters/cursor-local/
COPY packages/adapters/gemini-local/package.json packages/adapters/gemini-local/
COPY packages/adapters/grok-local/package.json packages/adapters/grok-local/
COPY packages/adapters/openclaw-gateway/package.json packages/adapters/openclaw-gateway/
COPY packages/adapters/opencode-local/package.json packages/adapters/opencode-local/
COPY packages/adapters/pi-local/package.json packages/adapters/pi-local/
COPY packages/plugins/sdk/package.json packages/plugins/sdk/
COPY --parents packages/plugins/sandbox-providers/./*/package.json packages/plugins/sandbox-providers/
COPY packages/plugins/paperclip-plugin-fake-sandbox/package.json packages/plugins/paperclip-plugin-fake-sandbox/
COPY packages/plugins/plugin-llm-wiki/package.json packages/plugins/plugin-llm-wiki/
COPY packages/plugins/plugin-workspace-diff/package.json packages/plugins/plugin-workspace-diff/
COPY patches/ patches/
COPY scripts/link-plugin-dev-sdk.mjs scripts/

RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter @paperclipai/ui build
RUN pnpm --filter @paperclipai/plugin-sdk build
RUN pnpm --filter @paperclipai/server build
RUN test -f server/dist/index.js || (echo "ERROR: server build output missing" && exit 1)

FROM base AS production
ARG USER_UID=1000
ARG USER_GID=1000
# Optional: set to the sha256 of /tmp/cursor-install.sh after downloading once and `sha256sum` locally.
ARG CURSOR_INSTALL_SCRIPT_SHA256=
WORKDIR /app
COPY --chown=node:node --from=build /app /app
<<<<<<< HEAD
RUN npm install --global --omit=dev @anthropic-ai/claude-code@latest @openai/codex@latest opencode-ai \
  && CURSOR_AGENT_HOME="$(mktemp -d)" \
  && curl -fsSL https://cursor.com/install -o /tmp/cursor-install.sh \
  && if [ -n "$CURSOR_INSTALL_SCRIPT_SHA256" ]; then printf '%s  /tmp/cursor-install.sh\n' "$CURSOR_INSTALL_SCRIPT_SHA256" | sha256sum -c -; fi \
  && HOME="$CURSOR_AGENT_HOME" sh /tmp/cursor-install.sh \
  && rm -f /tmp/cursor-install.sh \
  && CURSOR_AGENT_BIN="$CURSOR_AGENT_HOME/.local/bin/agent" \
  && test -x "$CURSOR_AGENT_BIN" \
  && CURSOR_AGENT_DIR="$(dirname "$(readlink -f "$CURSOR_AGENT_BIN")")" \
  && CURSOR_AGENT_VERSION="$(basename "$CURSOR_AGENT_DIR")" \
  && mkdir -p /usr/local/share/cursor-agent/versions \
  && rm -rf "/usr/local/share/cursor-agent/versions/$CURSOR_AGENT_VERSION" \
  && mv "$CURSOR_AGENT_DIR" "/usr/local/share/cursor-agent/versions/$CURSOR_AGENT_VERSION" \
  && ln -sf "/usr/local/share/cursor-agent/versions/$CURSOR_AGENT_VERSION/cursor-agent" /usr/local/bin/agent \
  && ln -sf /usr/local/bin/agent /usr/local/bin/cursor-agent \
  && rm -rf "$CURSOR_AGENT_HOME" \
=======
RUN npm install --global --omit=dev @anthropic-ai/claude-code@latest @openai/codex@latest opencode-ai @google/gemini-cli@latest \
>>>>>>> upstream/master
  && apt-get update \
  && apt-get install -y --no-install-recommends openssh-client jq \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /paperclip \
  && chown node:node /paperclip

COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Prepend user-writable HOME bin so CLI tools installed under /paperclip at runtime are discoverable;
# a populated volume can shadow same-named binaries from earlier PATH entries.
ENV NODE_ENV=production \
  HOME=/paperclip \
  PATH=/paperclip/.local/bin:$PATH \
  HOST=0.0.0.0 \
  PORT=3100 \
  SERVE_UI=true \
  PAPERCLIP_HOME=/paperclip \
  PAPERCLIP_INSTANCE_ID=default \
  USER_UID=${USER_UID} \
  USER_GID=${USER_GID} \
  PAPERCLIP_CONFIG=/paperclip/instances/default/config.json \
  PAPERCLIP_DEPLOYMENT_MODE=authenticated \
  PAPERCLIP_DEPLOYMENT_EXPOSURE=private \
  OPENCODE_ALLOW_ALL_MODELS=true \
  GEMINI_SANDBOX=false

VOLUME ["/paperclip"]
EXPOSE 3100

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "--import", "./server/node_modules/tsx/dist/loader.mjs", "server/dist/index.js"]
