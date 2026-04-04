# GitHub PR comments → Claude Code channel

This directory lives inside the [Paperclip](https://github.com/paperclipai/paperclip) repo. It is a small [Claude Code channel](https://code.claude.com/docs/en/channels) that forwards **GitHub PR review comments** into a running Claude Code session so Claude can act on them.

## Official Telegram channel (no custom server)

Anthropic ships a **Telegram** channel plugin; you do **not** need this repo to get “messages into Claude Code from your phone.”

- Install: `/plugin install telegram@claude-plugins-official` (refresh marketplace if needed: `/plugin marketplace update claude-plugins-official`)
- Configure: `/telegram:configure <token>` from [BotFather](https://t.me/BotFather)
- Run: `claude --channels plugin:telegram@claude-plugins-official`
- Pair and allowlist: follow the [Channels docs](https://code.claude.com/docs/en/channels)

**Trade-off:** Telegram is a **chat bridge**. GitHub does not push PR comments into Telegram automatically. You still need **something** (GitHub Action, bot, or manual paste) to turn a PR comment into a Telegram message—or use this webhook channel for **direct** GitHub → Claude Code.

Discord and iMessage are also in the same official plugin set; same idea.

## When to use this tool

Use `tools/github-pr-channel` when you want **GitHub webhooks** (review comments / reviews) delivered straight into Claude Code without an extra chat hop.

## MCP config (`~/.claude.json`)

Point the server at this file inside your clone (adjust the path if your clone differs):

```json
{
  "mcpServers": {
    "github-pr-comments": {
      "type": "stdio",
      "command": "/Users/YOU/.bun/bin/bun",
      "args": ["/ABSOLUTE/PATH/TO/paperclip/tools/github-pr-channel/channel.ts"],
      "env": {
        "GITHUB_WEBHOOK_SECRET": "",
        "PORT": "8789",
        "GITHUB_ALLOWED_BOTS": "coderabbitai[bot],your-review-bot[bot]"
      }
    }
  }
}
```

Set `GITHUB_WEBHOOK_SECRET` to match your GitHub webhook secret when not testing.

**PR review bots** post as GitHub users with `type: Bot`. By default those events are **ignored** so random bots cannot spam your session. Set **`GITHUB_ALLOWED_BOTS`** to a comma-separated list of **login names** (lowercase; include `[bot]` suffix if GitHub shows it, e.g. `my-reviewer[bot]`). Example: `GITHUB_ALLOWED_BOTS=coderabbitai[bot]`. Leave empty to only accept human reviewers.

## Run Claude Code with the channel

Custom / non-allowlisted channels need the development flag (see [Channels reference](https://code.claude.com/docs/en/channels-reference#test-during-the-research-preview)):

```bash
claude --dangerously-load-development-channels server:github-pr-comments
```

You should see stderr like: `GitHub PR channel listening on http://127.0.0.1:8789`

## Expose localhost and register the webhook

1. Install [ngrok](https://ngrok.com) (or similar) and run `ngrok http 8789`.
2. In the GitHub repo: **Settings → Webhooks → Add webhook**
   - **Payload URL**: your public URL (e.g. `https://….ngrok-free.app`)
   - **Content type**: `application/json`
   - **Secret**: same as `GITHUB_WEBHOOK_SECRET` (optional for local testing)
   - **Events**: “Let me select individual events” → enable **Pull request review comments** and **Pull request reviews**

## Dependencies

From this directory:

```bash
bun install
```

Requires [Bun](https://bun.sh) and a Claude Code build that supports channels (see Anthropic docs).
