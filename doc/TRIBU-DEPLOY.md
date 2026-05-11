# Tribu Paperclip deploy (fork + VM)

## Branch model

- **`paperclipai/paperclip` `master`** — upstream.
- **`elmanGSB/paperclip` `master`** — **strict mirror** of upstream `master`. No fork commits ever land here. Kept up-to-date by the `Upstream Sync` GitHub Action (`.github/workflows/upstream-sync.yml`) which fast-forwards it weekly.
- **`elmanGSB/paperclip` `fork/deploy`** — long-lived integration branch: `origin/master` plus fork-only and not-yet-upstream changes. **This is the source of truth for what Tribu ships.** All Docker builds and VM deploys are triggered off this branch.
- **Short-lived `fix/*` / `feat/*` on the fork** — use for **pull requests to upstream** (`paperclipai/paperclip`). When a PR merges upstream, the next scheduled sync will merge `origin/master` into `fork/deploy`; delete the fork topic branch if it is fully superseded.

VM (`~/paperclip` on `gcp-vm`):

- Branch **`deploy/vm`** tracks **`fork/fork/deploy`** (i.e. `elmanGSB/paperclip:fork/deploy`).
- **`git remote `origin`** → `https://github.com/paperclipai/paperclip.git`
- **`git remote `fork`** → `https://github.com/elmanGSB/paperclip.git`
- Set **`deploy/vm`** upstream: `git branch -u fork/fork/deploy deploy/vm`

## Why this layout

Past upstream syncs (PR #1 = 511 commits, PR #4 = 196 files) required hand-merging because fork commits, WIP code, and not-yet-upstream PRs all lived on `master` next to upstream's churn on the same files. Keeping `master` pristine and confining fork divergence to `fork/deploy` localizes every conflict to one branch and shrinks each sync to a single reviewable PR.

Docker (paths changed upstream; use repo root `.env` and project name **`paperclip`** so existing volumes stay attached):

```bash
cd ~/paperclip
docker compose -p paperclip -f docker/docker-compose.yml --env-file .env build server
docker compose -p paperclip -f docker/docker-compose.yml --env-file .env up -d
```

After a good deploy: annotated tag `deploy/vm-YYYYMMDD-HHMM` and append one line to **`~/paperclip/.deploy/shipped.log`** (UTC, tag, SHA, branch list).

Optional push: `git push fork deploy/vm` to back up the VM tip on the fork.

## Auto-deploy from GitHub Actions

After every push to fork `fork/deploy`, the `Docker` workflow builds and pushes
`ghcr.io/elmangsb/paperclip:latest`. A second job, `deploy-vm`, then SSHes to
the VM and runs the equivalent of the manual block above:

```bash
cd ~/paperclip
# Use whichever remote points at the fork (named "fork" on the current VM,
# falls back to "origin" on a fresh provision).
remote="$(git remote get-url fork >/dev/null 2>&1 && echo fork || echo origin)"
git fetch "$remote" fork/deploy
git checkout deploy/vm 2>/dev/null || git checkout -B deploy/vm "$remote/fork/deploy"
git reset --hard "$remote/fork/deploy"
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

## Upstream sync model

`Upstream Sync` (`.github/workflows/upstream-sync.yml`) runs weekly (Mondays
13:17 UTC) and can also be triggered manually from the Actions tab. Each run:

1. Fetches `paperclipai/paperclip:master`.
2. Fast-forwards `origin/master` to it (refuses non-fast-forward, so if `master`
   ever picks up fork commits the workflow fails loudly instead of silently
   deviating).
3. Creates `auto/upstream-sync-<sha>` from `fork/deploy`, merges upstream into
   it, and opens a draft PR back to `fork/deploy`. If the merge has conflicts,
   the conflict markers are committed as-is and the PR title is prefixed
   `[CONFLICTS]` so it's obvious in the PR list.

Reviewers resolve any conflicts on the sync branch, then merge the PR. Net
result: `fork/deploy` always lags `master` by at most one open sync PR, and the
PRs stay small (one week of upstream commits per batch).

**Tags** — the workflow also mirrors upstream tags (`v*`, etc.) into the fork
via `git push origin --tags`. Tags are only added, never moved, so fork-only
tags (e.g. `deploy/vm-*` created by `deploy-vm`) are unaffected.

**Auto-merge** — conflict-free sync PRs are opened as ready-for-review and
immediately marked auto-merge (squash). They merge themselves as soon as
branch-protection checks pass. This requires:

- Repo **Settings → General → "Allow auto-merge"** enabled.
- Branch protection on `fork/deploy` requiring at least one CI check
  (`verify`, `e2e`, etc.) — otherwise auto-merge fires instantly with no gate.

If "Allow auto-merge" is off, the workflow logs a warning and leaves the PR
for manual merge; nothing breaks.

**Why the upstream `docker.yml` on `master` is harmless after cutover** — once
the default branch flips to `fork/deploy`, pushes to `master` no longer satisfy
`{{is_default_branch}}` in upstream's image-metadata config, so the `latest`
tag is never re-pushed from a `master` build. The bot's weekly fast-forward
will still trigger a `type=sha` image build of pristine upstream code (a few
minutes of CI), which is harmless; live with it, or globally disable the
`Docker` workflow only on `master` via repo Settings → Actions if it becomes
annoying.

## One-time cutover runbook

These steps are required exactly once to switch from "fork commits live on
master" to the new layout. **They include a destructive operation
(`git push --force` to `master`), so run them deliberately — ideally after
this branch's PR is merged so the new workflow + retargeted `docker.yml` are
already on `fork/deploy`.**

**Repo settings to flip alongside the cutover:**

- **Settings → General → "Allow auto-merge"** ✅ (enables the workflow's
  auto-merge on conflict-free sync PRs).
- **Settings → Branches → branch protection for `fork/deploy`** — require
  the `verify` (and `e2e` if you want it gating) check. Otherwise auto-merge
  fires instantly.
- **Settings → Branches → branch protection for `master`** — disallow direct
  pushes from humans, allow `github-actions[bot]` to bypass (so the
  scheduled fast-forward still works). Disallow force-pushes.
- **Settings → Branches → default branch → `fork/deploy`** — required for the
  scheduled trigger of `Upstream Sync` to actually fire (GitHub only schedules
  workflows from the default branch).
- **Repo PRs** — review any remaining open PRs targeting `master` and either
  rebase them onto `fork/deploy` or close them.

```bash
# 0. Make sure your local clone is current and you have an `upstream` remote.
git fetch origin
git remote add upstream https://github.com/paperclipai/paperclip.git 2>/dev/null || true
git fetch upstream master

# 1. Create fork/deploy from the current master HEAD (preserves all fork work).
git push origin "refs/remotes/origin/master:refs/heads/fork/deploy"

# 2. Update branch protection on master to temporarily allow force-push
#    (Settings → Branches → master → "Allow force pushes"). Restore after step 3.

# 3. Force-reset master to upstream/master.
git push origin --force-with-lease=refs/heads/master:$(git rev-parse origin/master) \
                "refs/remotes/upstream/master:refs/heads/master"

# 4. Restore master branch protection (disallow force-push, require PR review).

# 5. Set fork/deploy as the default branch in repo Settings → Branches.

# 6. (Optional) trigger the workflow once to confirm it no-ops cleanly:
#    GitHub → Actions → "Upstream Sync" → "Run workflow".
```

After the cutover:

- All future fork work targets PRs into `fork/deploy`.
- The `Upstream Sync` workflow handles `master`; never push to it manually.
- The `Docker` workflow builds & deploys from `fork/deploy` only.

## Upstream PR queue (paperclipai/paperclip)

Open from this fork (merge upstream when accepted; then let the next scheduled
sync fold `origin/master` into `fork/deploy`):

| PR | Branch |
|----|--------|
| [#2689](https://github.com/paperclipai/paperclip/pull/2689) | `fix/preserve-skills-on-adapter-switch` |
| [#2425](https://github.com/paperclipai/paperclip/pull/2425) | `fix/codex-rollout-session-retry` |
| [#2373](https://github.com/paperclipai/paperclip/pull/2373) | `fix/skills-loading-hangs` |
| [#2372](https://github.com/paperclipai/paperclip/pull/2372) | `codex/fix-cursor-docker-cli` |
| [#2330](https://github.com/paperclipai/paperclip/pull/2330) | `fix/skill-materialization-cache` |

Until those land in upstream `master`, their commits are already folded into **`fork/deploy`** for Tribu production.
