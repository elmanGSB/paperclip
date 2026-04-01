#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createHmac } from "crypto";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? "";
const PORT = parseInt(process.env.PORT ?? "8789");

const mcp = new Server(
  { name: "github-pr-comments", version: "1.0.0" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
    },
    instructions: `GitHub PR review comments arrive as <channel source="github-pr-comments" ...> events.

When you receive a PR comment event:
1. Read the comment carefully — it contains the file path, line number, diff hunk (code context), and the reviewer's message.
2. Open the file mentioned in the "file" attribute.
3. Implement the requested change. The branch name is in the "branch" attribute — you are already on that branch.
4. If the comment asks a question rather than requesting a change, note it for the user.
5. After implementing, summarize what you changed.

Do not reply through this channel — it is one-way. Act on the feedback directly in the codebase.`,
  }
);

await mcp.connect(new StdioServerTransport());

function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return true;
  const expected =
    "sha256=" +
    createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  return signature === expected;
}

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await req.text();
    const event = req.headers.get("X-GitHub-Event") ?? "";
    const signature = req.headers.get("X-Hub-Signature-256") ?? "";

    if (WEBHOOK_SECRET && !verifySignature(body, signature)) {
      console.error("Rejected webhook: invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // Only handle review comments and reviews
    if (
      !["pull_request_review_comment", "pull_request_review"].includes(event)
    ) {
      return new Response("ok");
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const action = payload.action as string;

    // Only handle newly created items, not edits/deletions
    if (action !== "created" && action !== "submitted") {
      return new Response("ok");
    }

    if (event === "pull_request_review_comment") {
      const comment = payload.comment as Record<string, unknown>;
      const pr = payload.pull_request as Record<string, unknown>;
      const repo = payload.repository as Record<string, unknown>;
      const prHead = pr.head as Record<string, unknown>;
      const commentUser = comment.user as Record<string, unknown>;

      // Skip bot comments
      if (commentUser.type === "Bot") return new Response("ok");
      // Skip replies to existing comment threads unless they mention changes
      const commentBody = (comment.body as string) ?? "";

      const content = `PR inline review comment on ${repo.full_name} #${pr.number}: "${pr.title}"
Branch: ${prHead.ref}
File: ${comment.path} (line ${comment.line ?? comment.original_line ?? "?"})
Reviewer: ${commentUser.login}

Code context (diff hunk):
\`\`\`diff
${comment.diff_hunk}
\`\`\`

Comment: ${commentBody}

URL: ${comment.html_url}`;

      await mcp.notification({
        method: "notifications/claude/channel",
        params: {
          content,
          meta: {
            repo: repo.full_name as string,
            pr_number: String(pr.number),
            branch: prHead.ref as string,
            file: comment.path as string,
            comment_id: String(comment.id),
            author: commentUser.login as string,
            event_type: "inline_comment",
          },
        },
      });
    } else if (event === "pull_request_review") {
      const review = payload.review as Record<string, unknown>;
      const pr = payload.pull_request as Record<string, unknown>;
      const repo = payload.repository as Record<string, unknown>;
      const prHead = pr.head as Record<string, unknown>;
      const reviewUser = review.user as Record<string, unknown>;

      // Skip bot reviews or reviews with no body
      if (reviewUser.type === "Bot") return new Response("ok");
      const reviewBody = (review.body as string | null) ?? "";
      if (!reviewBody.trim()) return new Response("ok");

      const stateLabel: Record<string, string> = {
        APPROVED: "Approved",
        CHANGES_REQUESTED: "Changes requested",
        COMMENTED: "Commented",
      };

      const content = `PR review on ${repo.full_name} #${pr.number}: "${pr.title}"
Branch: ${prHead.ref}
Reviewer: ${reviewUser.login}
State: ${stateLabel[review.state as string] ?? (review.state as string)}

Review summary: ${reviewBody}

URL: ${review.html_url}`;

      await mcp.notification({
        method: "notifications/claude/channel",
        params: {
          content,
          meta: {
            repo: repo.full_name as string,
            pr_number: String(pr.number),
            branch: prHead.ref as string,
            review_id: String(review.id),
            author: reviewUser.login as string,
            state: review.state as string,
            event_type: "review",
          },
        },
      });
    }

    return new Response("ok");
  },
});

console.error(
  `GitHub PR channel listening on http://127.0.0.1:${PORT} (event: github-pr-comments)`
);
