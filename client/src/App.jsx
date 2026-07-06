import { useEffect, useRef, useState } from "react";
import { loadSaved, saveQuote, removeQuote, quoteIdFor } from "./storage.js";
import {
  renderShareCard,
  downloadCanvas,
  copyCanvasToClipboard,
} from "./shareCard.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const FALLBACK_TONES = {
  "Marcus Aurelius": "#7c8056",
  "Friedrich Nietzsche": "#8a4e3e",
  "Socrates": "#6b6357",
  "Epictetus": "#5a6469",
  "Albert Camus": "#9c7a4f",
};

function avatarInitial(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? name)[0];
}

function firstName(name) {
  return name.trim().split(/\s+/)[0];
}

function formatTime(d) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function formatRelative(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const sameDay =
    now.getFullYear() === d.getFullYear() &&
    now.getMonth() === d.getMonth() &&
    now.getDate() === d.getDate();
  if (sameDay) {
    const diffH = Math.floor(diffMin / 60);
    return `${diffH}h`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getFullYear() === d.getFullYear() &&
    yesterday.getMonth() === d.getMonth() &&
    yesterday.getDate() === d.getDate();
  if (isYesterday) return "yesterday";
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) {
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(d);
}

let messageId = 0;
const nextId = () => ++messageId;

export default function App() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [philosophers, setPhilosophers] = useState([]);
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(false);
  const [sessions, setSessions] = useState(null);
  const [sessionsError, setSessionsError] = useState("");
  const [shareTarget, setShareTarget] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const prevSelectedRef = useRef("");

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/philosophers`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = data.philosophers ?? [];
        setPhilosophers(list);
        if (list.length && !selected) {
          setSelected(list[0].name);
          prevSelectedRef.current = list[0].name;
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the philosophers.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Clear conversation when the user switches philosophers.
  useEffect(() => {
    if (!selected) return;
    if (prevSelectedRef.current && prevSelectedRef.current !== selected) {
      setMessages([]);
      setSessionId(null);
      setError("");
    }
    prevSelectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (!chatsOpen) return;
    let cancelled = false;
    setSessions(null);
    setSessionsError("");
    fetch(`${API_BASE}/api/sessions`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return;
        if (!ok) throw new Error(d?.error ?? "Could not load chats.");
        setSessions(d.groups ?? []);
      })
      .catch((err) => {
        if (!cancelled) setSessionsError(err.message ?? "Could not load chats.");
      });
    return () => {
      cancelled = true;
    };
  }, [chatsOpen]);

  async function handleLoadSession(id) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
      const philosopher = philosophers.find((p) => p.name === data.philosopherName);
      const hydrated = (data.messages ?? []).map((m) => {
        const base = {
          id: nextId(),
          role: m.role,
          text: m.text,
          timestamp: new Date(m.createdAt),
        };
        if (m.role === "philosopher") {
          return {
            ...base,
            philosopher: data.philosopherName,
            era: philosopher?.era ?? "",
            avatar: philosopher?.avatar ?? null,
          };
        }
        return base;
      });
      // Prevent the philosopher-switch effect from wiping the messages we just loaded.
      prevSelectedRef.current = data.philosopherName;
      setSelected(data.philosopherName);
      setMessages(hydrated);
      setSessionId(data.id);
      setError("");
      setChatsOpen(false);
    } catch (err) {
      setSessionsError(err.message ?? "Could not load chat.");
    }
  }

  function autoSize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = problem.trim();
    if (!trimmed || loading || !selected) return;

    const userMsg = {
      id: nextId(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setProblem("");
    setError("");
    setLoading(true);
    requestAnimationFrame(autoSize);

    const history = nextMessages
      .filter((m) => m.role === "user" || m.role === "philosopher")
      .slice(0, -1) // omit the user message we just appended (sent as `problem`)
      .map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: trimmed,
          philosopher: selected,
          history,
          sessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      if (data.sessionId) setSessionId(data.sessionId);
      const now = new Date();
      const philosopherMsgs = (data.responses ?? []).map((r, i) => ({
        id: nextId(),
        role: "philosopher",
        philosopher: r.philosopher,
        era: r.era,
        avatar: r.avatar,
        text: r.response,
        timestamp: new Date(now.getTime() + i * 600),
      }));
      setMessages((m) => [...m, ...philosopherMsgs]);
    } catch (err) {
      setError(err.message ?? "The voices fell silent.");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const savedIds = new Set(saved.map((q) => q.id));

  function handleToggleSave(message) {
    const id = quoteIdFor(message);
    if (savedIds.has(id)) {
      setSaved(removeQuote(id));
    } else {
      setSaved(
        saveQuote({
          id,
          philosopher: message.philosopher,
          era: message.era,
          avatar: message.avatar,
          text: message.text,
          savedAt: new Date().toISOString(),
        }),
      );
    }
  }

  function handleRemoveSaved(id) {
    setSaved(removeQuote(id));
  }

  const empty = messages.length === 0;
  const selectedPhilosopher = philosophers.find((p) => p.name === selected);

  return (
    <div className="stoa">
      <header className="masthead">
        <button
          type="button"
          className="masthead-action masthead-action-left"
          onClick={() => setChatsOpen(true)}
          aria-label="Open chats"
          title="Chats"
        >
          <ChatIcon />
        </button>
        <button
          type="button"
          className="masthead-action"
          onClick={() => setSavedOpen(true)}
          aria-label={`Open saved wisdom (${saved.length})`}
          title="Saved wisdom"
        >
          <ScrollIcon />
          {saved.length > 0 && <span className="badge">{saved.length}</span>}
        </button>
        <div className="laurel" aria-hidden="true">
          <svg viewBox="0 0 120 24" width="120" height="24">
            <path
              d="M10 12 Q 30 4, 56 12 Q 30 20, 10 12 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <path
              d="M110 12 Q 90 4, 64 12 Q 90 20, 110 12 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <circle cx="60" cy="12" r="1.4" fill="currentColor" />
          </svg>
        </div>
        <h1>Ask a Philosopher</h1>
        <p className="subtitle">A quiet stoa. Bring what weighs on you.</p>
      </header>

      <main className="chat" ref={scrollRef}>
        {empty && (
          <div className="welcome">
            {selectedPhilosopher ? (
              <>
                <Avatar
                  name={selectedPhilosopher.name}
                  src={selectedPhilosopher.avatar}
                  size={108}
                />
                <h2 className="welcome-name">{selectedPhilosopher.name}</h2>
                <p className="welcome-era">{selectedPhilosopher.era}</p>
                {selectedPhilosopher.bio && (
                  <p className="welcome-bio">{selectedPhilosopher.bio}</p>
                )}
                <div className="welcome-divider" aria-hidden="true" />
                <p className="welcome-invite">
                  Tell them what's on your mind.
                </p>
              </>
            ) : (
              <p className="welcome-invite">The stoa is waking.</p>
            )}
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} message={m} />
          ) : (
            <PhilosopherBubble
              key={m.id}
              message={m}
              saved={savedIds.has(quoteIdFor(m))}
              onToggleSave={() => handleToggleSave(m)}
              onShare={() => setShareTarget(m)}
            />
          ),
        )}

        {loading && <TypingBubble selected={selectedPhilosopher} />}
        {error && <p className="chat-error">{error}</p>}
      </main>

      <div className="selector" role="radiogroup" aria-label="Choose a philosopher">
        {philosophers.map((p) => {
          const active = p.name === selected;
          return (
            <button
              key={p.name}
              type="button"
              role="radio"
              aria-checked={active}
              className={"pick" + (active ? " pick-active" : "")}
              onClick={() => setSelected(p.name)}
              title={p.name}
            >
              <Avatar name={p.name} src={p.avatar} size={40} />
              <span className="pick-name">{firstName(p.name)}</span>
            </button>
          );
        })}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={problem}
          onChange={(e) => {
            setProblem(e.target.value);
            autoSize();
          }}
          onKeyDown={handleKey}
          placeholder={
            selectedPhilosopher
              ? `Ask ${firstName(selectedPhilosopher.name)}…`
              : "What weighs on you?"
          }
          rows={1}
          disabled={loading || !selected}
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={loading || !problem.trim() || !selected}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M4 12 L20 4 L14 20 L12 13 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>

      {savedOpen && (
        <SavedPanel
          saved={saved}
          onClose={() => setSavedOpen(false)}
          onRemove={handleRemoveSaved}
          onShare={(quote) => {
            setSavedOpen(false);
            setShareTarget(quote);
          }}
        />
      )}

      {chatsOpen && (
        <ChatListPanel
          sessions={sessions}
          error={sessionsError}
          philosophers={philosophers}
          onClose={() => setChatsOpen(false)}
          onSelect={handleLoadSession}
        />
      )}

      {shareTarget && (
        <ShareModal
          message={shareTarget}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  );
}

function Avatar({ name, src, size = 34 }) {
  const [failed, setFailed] = useState(false);
  const tone = FALLBACK_TONES[name] ?? "#7a6b58";
  const dim = { width: size, height: size, fontSize: Math.round(size * 0.5) };

  if (!src || failed) {
    return (
      <div
        className="avatar"
        style={{ ...dim, backgroundColor: tone }}
        aria-hidden="true"
      >
        <span>{avatarInitial(name)}</span>
      </div>
    );
  }
  return (
    <div
      className="avatar avatar-image"
      style={{ ...dim, backgroundColor: tone }}
      aria-hidden="true"
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

function PhilosopherBubble({ message, saved, onToggleSave, onShare }) {
  return (
    <div className="row row-left">
      <Avatar name={message.philosopher} src={message.avatar} />
      <div className="bubble-wrap">
        <div className="meta">
          <span className="name">{message.philosopher}</span>
          <span className="era">{message.era}</span>
        </div>
        <div className="bubble bubble-philosopher">{message.text}</div>
        <div className="bubble-actions">
          <span className="time">{formatTime(message.timestamp)}</span>
          <button
            type="button"
            className={"icon-btn" + (saved ? " icon-btn-on" : "")}
            onClick={onToggleSave}
            aria-label={saved ? "Remove from saved wisdom" : "Save quote"}
            title={saved ? "Saved" : "Save quote"}
          >
            <BookmarkIcon filled={saved} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onShare}
            aria-label="Share quote"
            title="Share"
          >
            <ShareIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ message }) {
  return (
    <div className="row row-right">
      <div className="bubble-wrap">
        <div className="bubble bubble-user">{message.text}</div>
        <div className="time time-right">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
}

function TypingBubble({ selected }) {
  return (
    <div className="row row-left typing-row">
      {selected ? (
        <Avatar name={selected.name} src={selected.avatar} />
      ) : (
        <div className="avatar avatar-ghost" aria-hidden="true">
          <span>·</span>
        </div>
      )}
      <div className="bubble-wrap">
        <div className="bubble bubble-philosopher typing">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  );
}

function SavedPanel({ saved, onClose, onRemove, onShare }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="panel"
        role="dialog"
        aria-label="Saved wisdom"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel-head">
          <div>
            <h2>Saved Wisdom</h2>
            <p className="panel-sub">
              {saved.length === 0
                ? "Nothing here yet."
                : `${saved.length} kept ${saved.length === 1 ? "quote" : "quotes"}.`}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="panel-body">
          {saved.length === 0 ? (
            <p className="panel-empty">
              When a reply moves you, tap the bookmark and it will live here.
            </p>
          ) : (
            <ul className="saved-list">
              {saved.map((q) => (
                <li key={q.id} className="saved-item">
                  <div className="saved-head">
                    <Avatar name={q.philosopher} src={q.avatar} size={36} />
                    <div className="saved-meta">
                      <span className="name">{q.philosopher}</span>
                      <span className="era">{q.era}</span>
                    </div>
                  </div>
                  <p className="saved-text">{q.text}</p>
                  <div className="saved-actions">
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => onShare(q)}
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      className="text-btn text-btn-quiet"
                      onClick={() => onRemove(q.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatListPanel({ sessions, error, philosophers, onClose, onSelect }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loading = sessions === null && !error;
  const empty = !loading && !error && sessions?.length === 0;
  const philByName = new Map(philosophers.map((p) => [p.name, p]));

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="panel"
        role="dialog"
        aria-label="Chats"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel-head">
          <div>
            <h2>Chats</h2>
            <p className="panel-sub">
              {loading
                ? "Gathering conversations…"
                : empty
                  ? "Nothing here yet."
                  : "Tap a conversation to return to it."}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="panel-body">
          {error && <p className="chat-error">{error}</p>}
          {empty && (
            <p className="panel-empty">
              Ask a philosopher something to begin. Their reply will live here.
            </p>
          )}
          {sessions && sessions.length > 0 && (
            <ul className="chat-groups">
              {sessions.map((group) => {
                const phil = philByName.get(group.philosopherName);
                return (
                  <li key={group.philosopherName} className="chat-group">
                    <div className="chat-group-head">
                      <Avatar
                        name={group.philosopherName}
                        src={phil?.avatar}
                        size={32}
                      />
                      <span className="name">{group.philosopherName}</span>
                    </div>
                    <ul className="chat-session-list">
                      {group.sessions.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="chat-session"
                            onClick={() => onSelect(s.id)}
                          >
                            <span className="chat-session-preview">
                              {s.lastRole === "user" ? "You: " : ""}
                              {s.preview}
                            </span>
                            <span className="chat-session-time">
                              {formatRelative(s.lastAt)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareModal({ message, onClose }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Composing card…");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    renderShareCard({
      philosopher: message.philosopher,
      era: message.era,
      avatar: message.avatar,
      text: message.text,
    })
      .then((canvas) => {
        if (cancelled) return;
        canvasRef.current = canvas;
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.borderRadius = "10px";
          containerRef.current.appendChild(canvas);
        }
        setReady(true);
        setStatus("");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(`Could not render card: ${err.message ?? err}`);
      });
    return () => {
      cancelled = true;
    };
  }, [message]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function flash(text) {
    setToast(text);
    setTimeout(() => setToast(""), 1800);
  }

  async function doDownload() {
    if (!canvasRef.current) return;
    const filename =
      message.philosopher.toLowerCase().replace(/\s+/g, "-") + "-quote.png";
    try {
      await downloadCanvas(canvasRef.current, filename);
      flash("Saved to downloads.");
    } catch (e) {
      flash(e.message ?? "Could not download.");
    }
  }

  async function doCopy() {
    if (!canvasRef.current) return;
    try {
      await copyCanvasToClipboard(canvasRef.current);
      flash("Copied to clipboard.");
    } catch (e) {
      flash(e.message ?? "Could not copy.");
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="panel share-panel"
        role="dialog"
        aria-label="Share quote"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel-head">
          <div>
            <h2>Share</h2>
            <p className="panel-sub">A card from {message.philosopher}.</p>
          </div>
          <button
            type="button"
            className="icon-btn close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="share-preview">
          <div ref={containerRef} className="share-canvas-wrap" />
          {!ready && <p className="share-status">{status}</p>}
        </div>

        <div className="share-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={doDownload}
            disabled={!ready}
          >
            Download
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={doCopy}
            disabled={!ready}
          >
            Copy
          </button>
        </div>
        {toast && <p className="share-toast">{toast}</p>}
      </div>
    </div>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M6 4 L6 21 L12 16.5 L18 21 L18 4 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M12 3 L12 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 8 L12 3 L17 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 13 L5 20 L19 20 L19 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M4 6.5 C 4 5 5 4 6.5 4 L17.5 4 C 19 4 20 5 20 6.5 L20 14.5 C 20 16 19 17 17.5 17 L10 17 L6 20.5 L6 17 C 5 17 4 16 4 14.5 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScrollIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M7 4 L17 4 C 18.5 4 19 5 19 6.5 L19 17.5 C 19 19 18.5 20 17 20 L7 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 4 C 5.5 4 5 5 5 6.5 C 5 8 5.5 9 7 9 L13 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 13 L15 13 M9 16 L13 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 6 L18 18 M18 6 L6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
