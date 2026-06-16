import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { useGame } from '../contexts/GameContext.jsx';
import { chatWithBuddy, TEACHING_METHODS } from '../utils/ai.js';

marked.setOptions({ breaks: true, gfm: true });

const WELCOME_BY_METHOD = {
  socratic: `Welcome. I guide you to answers through questions rather than giving them directly.

Select a subject you have added, ask a question, or use a quick action.`,
  direct: `Welcome. I explain concepts clearly and directly when you need a straight answer.

Select one of your subjects and ask away.`,
  feynman: `Welcome. I help you explain ideas in simple terms, the Feynman way. If you cannot explain it simply, there is a gap to close.

Pick a subject and tell me what you are trying to understand.`,
};

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  const html = marked.parse(msg.content);
  return (
    <div className={`ab-msg${isUser ? ' user' : ''}`}>
      <div className={`ab-avatar${isUser ? ' user' : ''}`}>{isUser ? 'Y' : 'A'}</div>
      <div className={`ab-bubble${isUser ? ' user' : ''}`} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function AIBuddy() {
  const { courses, weakTopics } = useCourses();
  const { earnXP, advanceChallenge, unlockAchievement } = useGame();
  const [subject, setSubject] = useState('General');
  const [method, setMethod] = useState('socratic');
  const [chats, setChats] = useState({ General: [{ role: 'assistant', content: WELCOME_BY_METHOD.socratic, id: 'welcome' }] });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMethodInfo, setShowMethodInfo] = useState(true);
  const bottomRef = useRef(null);

  const subjects = useMemo(() => {
    const fromCourses = courses.flatMap((c) => [c.code, c.name]);
    return ['General', ...new Set(fromCourses)];
  }, [courses]);

  const currentMethod = TEACHING_METHODS.find((m) => m.id === method) || TEACHING_METHODS[0];
  const messages = chats[subject] || [{ role: 'assistant', content: WELCOME_BY_METHOD[method], id: 'welcome' }];
  const exchangeCount = Math.max(0, messages.length - 1);

  const mastery = useMemo(() => {
    const map = {};
    weakTopics.forEach((t) => {
      map[t.name] = t.masteryLevel;
    });
    return map;
  }, [weakTopics]);

  useEffect(() => {
    if (!subjects.includes(subject)) setSubject('General');
  }, [subjects, subject]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  function switchMethod(next) {
    setMethod(next);
    setShowMethodInfo(true);
    setChats((prev) => ({
      ...prev,
      [subject]: [{ role: 'assistant', content: WELCOME_BY_METHOD[next], id: 'welcome' }],
    }));
  }

  const send = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;
      const userMsg = { role: 'user', content: text, id: crypto.randomUUID() };
      setChats((prev) => ({ ...prev, [subject]: [...(prev[subject] || []), userMsg] }));
      setInput('');
      setLoading(true);
      try {
        const history = [...(chats[subject] || []), userMsg]
          .filter((m) => m.role !== 'assistant' || m.id !== 'welcome')
          .map(({ role, content }) => ({ role, content }));
        const replyText = await chatWithBuddy(history, subject, mastery, method);
        const assistantMsg = { role: 'assistant', content: replyText, id: crypto.randomUUID() };
        setChats((prev) => ({ ...prev, [subject]: [...(prev[subject] || []), assistantMsg] }));
        earnXP(10);
        advanceChallenge('chat_10', 1);
        unlockAchievement('chat_first');
      } catch {
        const errMsg = { role: 'assistant', content: 'I encountered an issue. Please try again.', id: crypto.randomUUID() };
        setChats((prev) => ({ ...prev, [subject]: [...(prev[subject] || []), errMsg] }));
      } finally {
        setLoading(false);
      }
    },
    [loading, chats, subject, mastery, method, earnXP, advanceChallenge, unlockAchievement],
  );

  function quickAction(action) {
    const weak = Object.entries(mastery)
      .slice(0, 3)
      .map(([k, v]) => `${k} (${v}%)`)
      .join(', ');
    const prompts = {
      quiz: `Quiz me on ${subject}. Give me 5 challenging questions that target my weak areas.`,
      plan: `Create a personalised study plan for me. My weak areas are: ${weak || 'not yet tracked'}. Focus on what I need most.`,
      explain: `What's the most important concept I should understand in ${subject} right now?`,
      summary: `Give me a structured overview of the key topics in ${subject} and highlight which areas I should prioritize.`,
    };
    send(prompts[action]);
  }

  function clearChat() {
    setChats((prev) => ({
      ...prev,
      [subject]: [{ role: 'assistant', content: WELCOME_BY_METHOD[method], id: 'welcome' }],
    }));
  }

  return (
    <main className="page fc-page ab-page anim-fade-in">
      <div className="fc-wrap">
        <header className="fc-header">
          <div>
            <p className="fc-kicker">AI Buddy</p>
            <h1 className="fc-title">Study assistant</h1>
            <p className="fc-sub">
              {currentMethod.label} · {subject} · {exchangeCount} exchange{exchangeCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="fc-tabs" role="tablist" aria-label="Teaching method">
            {TEACHING_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={method === m.id}
                className={`fc-tab${method === m.id ? ' active' : ''}`}
                onClick={() => switchMethod(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="ab-methods-note">More teaching method modules are on the way.</p>
        </header>

        {showMethodInfo && (
          <div className="ab-method-banner card">
            <p><strong>{currentMethod.label}</strong>: {currentMethod.why}</p>
            <p className="ab-method-banner-detail">{currentMethod.detail}</p>
          </div>
        )}

        <div className="ab-body">
          <aside className="ab-panel card">
            <p className="card-label">Subject</p>
            {subjects.length === 1 && (
              <p className="ab-panel-hint">Add courses to see more subjects here.</p>
            )}
            <div className="ab-subj-list">
              {subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`ab-subj-btn${subject === s ? ' active' : ''}`}
                  onClick={() => setSubject(s)}
                  id={`btn-ab-subj-${s.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <p className="card-label" style={{ marginTop: 20 }}>Quick actions</p>
            <div className="ab-quick-list">
              <button type="button" className="ab-quick-btn" onClick={() => quickAction('quiz')} id="btn-ab-quiz">Quiz me</button>
              <button type="button" className="ab-quick-btn" onClick={() => quickAction('plan')} id="btn-ab-plan">Study plan</button>
              <button type="button" className="ab-quick-btn" onClick={() => quickAction('explain')} id="btn-ab-explain">Key concepts</button>
              <button type="button" className="ab-quick-btn" onClick={() => quickAction('summary')} id="btn-ab-summary">Topic overview</button>
            </div>

          </aside>

          <section className="ab-chat-panel card">
            <div className="ab-chat-toolbar">
              <span className="tag">{subject}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearChat} id="btn-ab-clear">
                Clear chat
              </button>
            </div>

            <div className="ab-messages" role="log" aria-live="polite">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} />
              ))}
              {loading && (
                <div className="ab-msg">
                  <div className="ab-avatar">A</div>
                  <div className="ab-bubble">
                    <div className="ab-typing">
                      <div className="ab-typing-dot" />
                      <div className="ab-typing-dot" />
                      <div className="ab-typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="ab-input-bar">
              <textarea
                id="ab-input"
                className="form-input ab-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={`Ask about ${subject}...`}
                aria-label="Chat input"
                rows={2}
              />
              <button className="btn btn-primary" onClick={() => send(input)} disabled={loading || !input.trim()} id="btn-ab-send">
                Send
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
