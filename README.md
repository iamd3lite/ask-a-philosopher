# Ask a Philosopher

Bring a real-life problem; get responses from 2–3 historical philosophers, each in their own voice and worldview, grounded in their real ideas.

## Structure

```
/client   React + Vite frontend
/server   Node + Express backend
/data     JSON files, one per philosopher
```

Bundled philosophers: Marcus Aurelius, Friedrich Nietzsche, Socrates, Epictetus, Albert Camus.

## Setup

You need an Anthropic API key for general API access (a Claude Code-only key will not work — the backend calls `messages.create` directly).

```bash
# Backend
cd server
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=...
npm install

# Frontend
cd ../client
npm install
```

## Run

Two terminals:

```bash
# terminal 1
cd server && npm run dev
# → http://localhost:3001

# terminal 2
cd client && npm run dev
# → http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the backend.

## How it works

1. Frontend POSTs `{ problem: string }` to `/api/ask`.
2. Backend scores the problem against a small keyword map and picks 3 philosophers (falling back to a rotating default set when keywords don't match).
3. For each chosen philosopher, the backend calls the Claude API with a prompt that includes the philosopher's core ideas and sample quotes from `/data/<name>.json`, asking Claude to respond in 3–5 sentences in the philosopher's voice.
4. Backend returns `{ responses: [{ philosopher, era, response }] }`.
5. Frontend renders each response as a card.

Model: `claude-sonnet-4-6`.

## Adding a philosopher

Drop a new `*.json` into `/data` with this shape:

```json
{
  "name": "...",
  "era": "...",
  "core_ideas": ["...", "..."],
  "sample_quotes": ["...", "..."]
}
```

Restart the backend. Optionally add a keyword entry in `server/index.js` (`KEYWORD_MAP`) so the new voice gets picked for relevant problems.
