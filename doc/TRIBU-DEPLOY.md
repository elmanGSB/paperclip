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

## Auto-deploy from GitHub Actions

After every push to fork `master`, the `Docker` workflow builds and pushes
`ghcr.io/elmangsb/paperclip:latest`. A second job, `deploy-vm`, then SSHes to
the VM and runs the equivalent of the manual block above:

```bash
cd ~/paperclip
# Use whichever remote points at the fork (named "fork" on the current VM,
# falls back to "origin" on a fresh provision).
remote="$(git remote get-url fork >/dev/null 2>&1 && echo fork || echo origin)"
git fetch "$remote" master
git checkout deploy/vm 2>/dev/null || git checkout -B deploy/vm "$remote/master"
git reset --hard "$remote/master"
docker compose -p paperclip -f docker/docker-compose.yml --env-file .env pull
docker compose -p paperclip -f docker/docker-compose.yml --env-file .env up -d
# annotated tag + append to .deploy/shipped.log
```

`docker/docker-compose.yml` declares both `image:` and `build:` for the
`server` service. CI publishes the image; the VM consumes it via `pull` rather
than rebuilding. To roll back, set `PAPERCLIP_IMAGE_TAG` in `.env` to a
specific tag (e.g. `sha-<7chars>`) and run `docker compose pull && up -d`
manually.

### Required GitHub secrets

Configure under repo **Settings → Secrets and variables → Actions**:

| Secret | Value |
|----|----|
| `VM_HOST` | VM hostname or IP |
| `VM_USER` | SSH user (ideally a deploy-only account in the `docker` group) |
| `VM_SSH_KEY` | private key (full PEM contents) authorized on the VM |
| `VM_KNOWN_HOSTS` | output of `ssh-keyscan -H -p $PORT $HOST` from a trusted machine |
| `VM_SSH_PORT` | optional; defaults to `22` |

### One-time VM setup

```bash
# On a trusted machine, generate the deploy key:
ssh-keygen -t ed25519 -C 'paperclip-gh-deploy' -f ./gh_deploy -N ''

# Install the public key on the VM as the deploy user:
ssh "$VM_USER@$VM_HOST" 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys' \
    < ./gh_deploy.pub

# Capture the host fingerprint (paste into VM_KNOWN_HOSTS):
ssh-keyscan -H -p 22 "$VM_HOST"

# On the VM: ensure the deploy user is in the docker group and ~/paperclip
# has origin pointing to the fork:
sudo usermod -aG docker "$VM_USER"     # then re-login
cd ~/paperclip && git remote -v        # origin → elmanGSB/paperclip.git
```

Paste the **private key** into `VM_SSH_KEY` and delete the local copy. Open
the VM's firewall to GitHub Actions runner egress
([documented IP ranges](https://api.github.com/meta) → `actions`), or front
the VM with a fixed bastion / Tailscale and put that host in `VM_HOST`.

The `deploy-vm` job is gated on `github.repository == 'elmanGSB/paperclip'`,
so a future upstream merge of these workflow changes is a no-op for upstream.

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
