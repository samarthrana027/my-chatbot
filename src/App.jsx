import { useState, useRef, useEffect } from "react";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_KEY; // Replace with your key

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #13131a;
    --surface2: #1c1c28;
    --border: #2a2a3d;
    --accent: #7c6af7;
    --accent2: #f76ab4;
    --accent-glow: rgba(124, 106, 247, 0.25);
    --text: #e8e8f0;
    --text-dim: #6b6b8a;
    --user-bubble: linear-gradient(135deg, #7c6af7, #a855f7);
    --bot-bubble: #1c1c28;
    --font-head: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --radius: 18px;
  }

  html, body, #root {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 780px;
    margin: 0 auto;
    position: relative;
  }

  /* ── Noise overlay ── */
  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.5;
  }

  /* ── Header ── */
  header {
    position: relative;
    z-index: 10;
    padding: 20px 28px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(10,10,15,0.85);
    backdrop-filter: blur(12px);
  }

  .logo-ring {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--user-bubble);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 20px var(--accent-glow);
    flex-shrink: 0;
    animation: pulse-ring 3s ease-in-out infinite;
  }

  @keyframes pulse-ring {
    0%, 100% { box-shadow: 0 0 20px var(--accent-glow); }
    50% { box-shadow: 0 0 35px rgba(124,106,247,0.45); }
  }

  .header-text h1 {
    font-family: var(--font-head);
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text);
  }

  .header-text p {
    font-size: 11px;
    color: var(--text-dim);
    font-style: italic;
    margin-top: 1px;
  }

  .status-dot {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-dim);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    animation: blink 2s ease-in-out infinite;
  }

  .dot.thinking { background: var(--accent2); }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── Messages ── */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 28px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 1;
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ── Welcome state ── */
  .welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
    padding: 40px;
    animation: fade-up 0.6s ease both;
  }

  .welcome-icon {
    font-size: 52px;
    margin-bottom: 8px;
  }

  .welcome h2 {
    font-family: var(--font-head);
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .welcome p {
    font-size: 13px;
    color: var(--text-dim);
    max-width: 320px;
    line-height: 1.7;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 16px;
  }

  .suggestion-chip {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 100px;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-dim);
    background: var(--surface);
    cursor: pointer;
    transition: all 0.2s;
  }

  .suggestion-chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(124,106,247,0.06);
    transform: translateY(-1px);
  }

  /* ── Message row ── */
  .msg-row {
    display: flex;
    gap: 12px;
    animation: fade-up 0.35s ease both;
  }

  .msg-row.user { flex-direction: row-reverse; }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .avatar.bot { background: var(--surface2); border: 1px solid var(--border); }
  .avatar.user { background: var(--user-bubble); box-shadow: 0 4px 14px var(--accent-glow); }

  .bubble-wrap { display: flex; flex-direction: column; gap: 4px; max-width: 72%; }
  .msg-row.user .bubble-wrap { align-items: flex-end; }

  .bubble {
    padding: 12px 16px;
    border-radius: var(--radius);
    font-size: 13.5px;
    line-height: 1.75;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .bubble.bot {
    background: var(--bot-bubble);
    border: 1px solid var(--border);
    border-top-left-radius: 4px;
    color: var(--text);
  }

  .bubble.user {
    background: var(--user-bubble);
    border-top-right-radius: 4px;
    color: #fff;
    box-shadow: 0 4px 18px var(--accent-glow);
  }

  .timestamp {
    font-size: 10px;
    color: var(--text-dim);
    font-style: italic;
    padding: 0 4px;
  }

  /* ── Typing indicator ── */
  .typing-dots {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 14px 16px;
    background: var(--bot-bubble);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    border-top-left-radius: 4px;
    width: fit-content;
  }

  .typing-dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-dim);
    animation: bounce 1.2s ease-in-out infinite;
  }

  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }

  /* ── Input bar ── */
  .input-area {
    position: relative;
    z-index: 10;
    padding: 16px 20px 20px;
    border-top: 1px solid var(--border);
    background: rgba(10,10,15,0.9);
    backdrop-filter: blur(12px);
  }

  .input-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 10px 10px 10px 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .input-row:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13.5px;
    line-height: 1.6;
    min-height: 24px;
    max-height: 140px;
    overflow-y: auto;
    caret-color: var(--accent);
  }

  textarea::placeholder { color: var(--text-dim); }

  .send-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: none;
    background: var(--user-bubble);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s;
    box-shadow: 0 2px 10px var(--accent-glow);
  }

  .send-btn:hover:not(:disabled) { transform: scale(1.07); box-shadow: 0 4px 18px var(--accent-glow); }
  .send-btn:active:not(:disabled) { transform: scale(0.95); }
  .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .send-btn svg { width: 16px; height: 16px; fill: #fff; }

  .input-hint {
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 8px;
    text-align: center;
    font-style: italic;
  }
`;

const suggestions = [
  "Explain quantum entanglement simply",
  "Write a haiku about code",
  "What's the meaning of life?",
  "Give me a fun fact",
];

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed, time: new Date() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");

      const reply = data.choices[0].message.content;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, time: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${err.message}`,
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{style}</style>
      <div className="app">
        {/* Header */}
        <header>
          <div className="logo-ring">✦</div>
          <div className="header-text">
            <h1>NeuralChat</h1>
            <p>powered by gpt-4o-mini</p>
          </div>
          <div className="status-dot">
            <span className={`dot ${loading ? "thinking" : ""}`} />
            {loading ? "thinking…" : "online"}
          </div>
        </header>

        {/* Messages */}
        <div className="messages">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon">✦</div>
              <h2>What's on your mind?</h2>
              <p>Ask me anything — I'm powered by OpenAI's gpt-4o-mini and ready to help.</p>
              <div className="suggestions">
                {suggestions.map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`msg-row ${m.role === "user" ? "user" : "bot"}`}>
                <div className={`avatar ${m.role === "user" ? "user" : "bot"}`}>
                  {m.role === "user" ? "👤" : "✦"}
                </div>
                <div className="bubble-wrap">
                  <div className={`bubble ${m.role === "user" ? "user" : "bot"}`}>
                    {m.content}
                  </div>
                  <span className="timestamp">{formatTime(m.time)}</span>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="msg-row bot">
              <div className="avatar bot">✦</div>
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
          <p className="input-hint">Shift + Enter for new line</p>
        </div>
      </div>
    </>
  );
}