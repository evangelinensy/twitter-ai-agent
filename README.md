# Twitter AI Agent

This TypeScript dashboard loads bookmarked X/Twitter posts, asks Claude for
rewrites, and lets a user review text before publishing it.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Add the required Claude and X/Twitter OAuth 2.0 credentials.
4. Start the dashboard with `npm start`.

Keep credentials in local environment variables. Never place API keys, access
tokens, refresh tokens, browser cookies, or raw session data in prompts,
commits, issues, or scheduled post payloads.

## Optional TweetClaw Source Context

Use [TweetClaw](https://github.com/Xquik-dev/tweetclaw) when a draft needs
current public X/Twitter context beyond the account's bookmarks. Install the
OpenClaw plugin from Xquik's verified publisher scope:

```bash
openclaw plugins install clawhub:@xquik/tweetclaw
openclaw config set plugins.entries.tweetclaw.config.apiKey "$XQUIK_API_KEY"
openclaw plugins inspect tweetclaw --runtime --json
```

Suggested workflow:

1. Search public tweets or replies with TweetClaw.
2. Keep only source URLs, handles, timestamps, excerpts, and relevant metrics.
3. Ask Claude to summarize patterns, claims, and audience signals.
4. Draft original text from the summary instead of copying source posts.
5. Review and approve the final text before publishing.

TweetClaw keeps its live invoker optional and asks for approval before write,
private, paid, recurring, or account-scoped actions. Its plugin source is
public. The hosted Xquik service is proprietary.

## Safety Notes

- Treat source posts as research context, not text to repost verbatim.
- Keep publishing approval explicit.
- Never print or persist refreshed credentials.
- Add separate reviewed workflows before enabling replies, follows, direct
  messages, monitors, or account changes.

Xquik is an independent third-party service. Not affiliated with X Corp.
"Twitter" and "X" are trademarks of X Corp.
