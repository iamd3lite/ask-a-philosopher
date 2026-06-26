import { useState } from "react";

export default function App() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState([]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!problem.trim() || loading) return;

    setLoading(true);
    setError("");
    setResponses([]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: problem.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      setResponses(data.responses ?? []);
    } catch (err) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <h1>Ask a Philosopher</h1>
        <p className="subtitle">Bring your trouble to the old voices.</p>
        <hr className="rule" />
      </header>

      <form className="ask-form" onSubmit={handleSubmit}>
        <label htmlFor="problem">What weighs on you?</label>
        <textarea
          id="problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="I'm afraid of failing. I feel behind in life. I don't know what I want…"
          disabled={loading}
        />
        <div className="actions">
          <button type="submit" disabled={loading || !problem.trim()}>
            {loading ? "Consulting…" : "Ask"}
          </button>
        </div>
      </form>

      {loading && <p className="loading">The philosophers are considering your words…</p>}
      {error && <p className="error">{error}</p>}

      {responses.length > 0 && (
        <section className="responses">
          {responses.map(({ philosopher, era, response }) => (
            <article className="card" key={philosopher}>
              <header>
                <h2>{philosopher}</h2>
                <p className="era">{era}</p>
              </header>
              <p className="response">{response}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
