// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import Anthropic from "@anthropic-ai/sdk";
// import { readFile, readdir } from "fs/promises";
// import { join, dirname } from "path";
// import { fileURLToPath } from "url";

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const DATA_DIR = join(__dirname, "..", "data");

// const app = express();
// app.use(cors());
// app.use(express.json());

// const client = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// // Load all philosophers from /data once at startup.
// async function loadPhilosophers() {
//   const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
//   const philosophers = [];
//   for (const f of files) {
//     const raw = await readFile(join(DATA_DIR, f), "utf8");
//     philosophers.push(JSON.parse(raw));
//   }
//   return philosophers;
// }

// const PHILOSOPHERS = await loadPhilosophers();
// console.log(`Loaded ${PHILOSOPHERS.length} philosophers: ${PHILOSOPHERS.map((p) => p.name).join(", ")}`);

// // Simple keyword map → philosopher names. Falls back to a rotating default set.
// const KEYWORD_MAP = [
//   { name: "Marcus Aurelius", keywords: ["control", "duty", "anger", "work", "death", "discipline", "responsibility", "morning", "habit"] },
//   { name: "Friedrich Nietzsche", keywords: ["meaning", "purpose", "boring", "weak", "strong", "creative", "art", "stuck", "conform", "lonely", "different", "passion"] },
//   { name: "Socrates", keywords: ["confused", "don't know", "question", "wisdom", "truth", "argument", "belief", "wrong", "right", "examine"] },
//   { name: "Epictetus", keywords: ["lost", "grief", "out of my hands", "unfair", "react", "powerless", "money", "poverty", "freedom", "slave"] },
//   { name: "Albert Camus", keywords: ["pointless", "absurd", "meaningless", "suicide", "hopeless", "rebel", "rebellion", "summer", "winter", "tired", "hate my life"] },
// ];

// function pickPhilosophers(problem, n = 3) {
//   const text = problem.toLowerCase();
//   const scored = KEYWORD_MAP.map(({ name, keywords }) => ({
//     name,
//     score: keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0),
//   }));

//   const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

//   // Use the highest-scoring matches first, then fill with defaults.
//   const defaults = ["Marcus Aurelius", "Friedrich Nietzsche", "Socrates"];
//   const picked = [];
//   for (const m of matched) {
//     if (picked.length >= n) break;
//     picked.push(m.name);
//   }
//   for (const d of defaults) {
//     if (picked.length >= n) break;
//     if (!picked.includes(d)) picked.push(d);
//   }
//   return picked.slice(0, n).map((name) => PHILOSOPHERS.find((p) => p.name === name)).filter(Boolean);
// }

// function buildPrompt(philosopher, userInput) {
//   const grounding = [
//     "Core ideas:",
//     ...philosopher.core_ideas.map((i) => `- ${i}`),
//     "",
//     "Sample quotes (their actual recorded words):",
//     ...philosopher.sample_quotes.map((q) => `- "${q}"`),
//   ].join("\n");

//   return `You are simulating the philosopher ${philosopher.name}, grounded strictly in their real recorded ideas and writing style.

// Reference material:
// ${grounding}

// A person has shared this problem: "${userInput}"

// Respond in 3-5 sentences, in ${philosopher.name}'s voice and worldview, as if speaking directly to this person. Be specific to their problem, not generic. End with one practical reflection or exercise rooted in their philosophy.

// Do not break character. Do not mention you are an AI.`;
// }

// async function askPhilosopher(philosopher, userInput) {
//   const message = await client.messages.create({
//     model: "claude-sonnet-4-6",
//     max_tokens: 1024,
//     messages: [{ role: "user", content: buildPrompt(philosopher, userInput) }],
//   });
//   const textBlock = message.content.find((b) => b.type === "text");
//   return {
//     philosopher: philosopher.name,
//     era: philosopher.era,
//     response: textBlock?.text?.trim() ?? "",
//   };
// }

// app.post("/api/ask", async (req, res) => {
//   const { problem } = req.body ?? {};
//   if (typeof problem !== "string" || !problem.trim()) {
//     return res.status(400).json({ error: "Missing or empty 'problem' field." });
//   }

//   try {
//     const chosen = pickPhilosophers(problem, 3);
//     const responses = await Promise.all(chosen.map((p) => askPhilosopher(p, problem.trim())));
//     res.json({ responses });
//   } catch (err) {
//     console.error("Error in /api/ask:", err);
//     const status = err?.status ?? 500;
//     res.status(status).json({ error: err?.message ?? "Internal error" });
//   }
// });

// app.get("/api/health", (_req, res) => {
//   res.json({ ok: true, philosophers: PHILOSOPHERS.map((p) => p.name) });
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Ask a Philosopher backend listening on http://localhost:${PORT}`);
// });

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { readFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "data");

const app = express();
app.use(cors());
app.use(express.json());

// Load all philosophers from /data once at startup.
async function loadPhilosophers() {
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  const philosophers = [];
  for (const f of files) {
    const raw = await readFile(join(DATA_DIR, f), "utf8");
    philosophers.push(JSON.parse(raw));
  }
  return philosophers;
}

const PHILOSOPHERS = await loadPhilosophers();
console.log(`Loaded ${PHILOSOPHERS.length} philosophers: ${PHILOSOPHERS.map((p) => p.name).join(", ")}`);

// Simple keyword map → philosopher names. Falls back to a rotating default set.
const KEYWORD_MAP = [
  { name: "Marcus Aurelius", keywords: ["control", "duty", "anger", "work", "death", "discipline", "responsibility", "morning", "habit"] },
  { name: "Friedrich Nietzsche", keywords: ["meaning", "purpose", "boring", "weak", "strong", "creative", "art", "stuck", "conform", "lonely", "different", "passion"] },
  { name: "Socrates", keywords: ["confused", "don't know", "question", "wisdom", "truth", "argument", "belief", "wrong", "right", "examine"] },
  { name: "Epictetus", keywords: ["lost", "grief", "out of my hands", "unfair", "react", "powerless", "money", "poverty", "freedom", "slave"] },
  { name: "Albert Camus", keywords: ["pointless", "absurd", "meaningless", "suicide", "hopeless", "rebel", "rebellion", "summer", "winter", "tired", "hate my life"] },
];

function pickPhilosophers(problem, n = 3) {
  const text = problem.toLowerCase();
  const scored = KEYWORD_MAP.map(({ name, keywords }) => ({
    name,
    score: keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0),
  }));

  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

  const defaults = ["Marcus Aurelius", "Friedrich Nietzsche", "Socrates"];
  const picked = [];
  for (const m of matched) {
    if (picked.length >= n) break;
    picked.push(m.name);
  }
  for (const d of defaults) {
    if (picked.length >= n) break;
    if (!picked.includes(d)) picked.push(d);
  }
  return picked.slice(0, n).map((name) => PHILOSOPHERS.find((p) => p.name === name)).filter(Boolean);
}

function buildPrompt(philosopher, userInput) {
  const grounding = [
    "Core ideas:",
    ...philosopher.core_ideas.map((i) => `- ${i}`),
    "",
    "Sample quotes (their actual recorded words):",
    ...philosopher.sample_quotes.map((q) => `- "${q}"`),
  ].join("\n");

  return `You are simulating the philosopher ${philosopher.name}, grounded strictly in their real recorded ideas and writing style.

Reference material:
${grounding}

A person has shared this problem: "${userInput}"

Respond in 3-5 sentences, in ${philosopher.name}'s voice and worldview, as if speaking directly to this person. Be specific to their problem, not generic. End with one practical reflection or exercise rooted in their philosophy.

Do not break character. Do not mention you are an AI.`;
}

async function askPhilosopher(philosopher, userInput) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(philosopher, userInput) }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return {
    philosopher: philosopher.name,
    era: philosopher.era,
    response: data.choices[0].message.content.trim(),
  };
}

app.post("/api/ask", async (req, res) => {
  const { problem } = req.body ?? {};
  if (typeof problem !== "string" || !problem.trim()) {
    return res.status(400).json({ error: "Missing or empty 'problem' field." });
  }

  try {
    const chosen = pickPhilosophers(problem, 3);
    const responses = await Promise.all(chosen.map((p) => askPhilosopher(p, problem.trim())));
    res.json({ responses });
  } catch (err) {
    console.error("Error in /api/ask:", err);
    const status = err?.status ?? 500;
    res.status(status).json({ error: err?.message ?? "Internal error" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, philosophers: PHILOSOPHERS.map((p) => p.name) });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Ask a Philosopher backend listening on http://localhost:${PORT}`);
});