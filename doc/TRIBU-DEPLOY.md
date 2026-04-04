# Tribu Paperclip deploy (fork + VM)

Branches:

- **`paperclipai/paperclip` `master`** — upstream; treat as read-only on the VM.
- **`elmanGSB/paperclip` `tribu/deploy`** — long-lived integration branch: current `origin/master` plus Tribu-only and not-yet-upstream changes. This is the **source of truth** for what Tribu ships.
- **Short-lived `fix/*` / `feat/*` on the fork** — use for **pull requests to upstream** (`paperclipai/paperclip`). When a PR merges upstream, merge `origin/master` into `tribu/deploy` and delete the fork topic branch if it is fully superseded.

VM (`~/paperclip` on `gcp-vm`):

- Branch **`deploy/vm`** should match **`fork/tribu/deploy`** (reset or merge; then rebuild containers).
- **`git remote `origin`** → `https://github.com/paperclipai/paperclip.git`
- **`git remote `fork`** → `https://github.com/elmanGSB/paperclip.git`
- Set **`deploy/vm`** upstream: `git branch -u fork/tribu/deploy deploy/vm`

Docker (paths changed upstream; use repo root `.env` and project name **`paperclip`** so existing volumes stay attached):

```bash
cd ~/paperclip
docker compose -p paperclip -f docker/docker-compose.yml --env-file .env build server
docker compose -p paperclip -f docker/docker-compose.yml --env-file .env up -d
```

After a good deploy: annotated tag `deploy/vm-YYYYMMDD-HHMM` and append one line to **`~/paperclip/.deploy/shipped.log`** (UTC, tag, SHA, branch list).

Optional push: `git push fork deploy/vm` to back up the VM tip on the fork.

## Upstream PR queue (paperclipai/paperclip)

Open from this fork (merge upstream when accepted; then merge `origin/master` into `tribu/deploy`):

| PR | Branch |
|----|--------|
| [#2689](https://github.com/paperclipai/paperclip/pull/2689) | `fix/preserve-skills-on-adapter-switch` |
| [#2425](https://github.com/paperclipai/paperclip/pull/2425) | `fix/codex-rollout-session-retry` |
| [#2373](https://github.com/paperclipai/paperclip/pull/2373) | `fix/skills-loading-hangs` |
| [#2372](https://github.com/paperclipai/paperclip/pull/2372) | `codex/fix-cursor-docker-cli` |
| [#2330](https://github.com/paperclipai/paperclip/pull/2330) | `fix/skill-materialization-cache` |

Until those land in `master`, their commits are already folded into **`tribu/deploy`** for Tribu production.
