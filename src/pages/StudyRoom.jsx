import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Eraser,
  Lock,
  Minus,
  Pen,
  Send,
  Settings,
  Square,
  Trash2,
  Type,
  Users,
  User,
} from 'lucide-react';
import { useGame } from '../contexts/GameContext.jsx';
import { useStudyGroups } from '../contexts/StudyGroupsContext.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import {
  DEFAULT_ROOM_SETTINGS,
  getRoom,
  registerRoom,
  unregisterRoom,
  validateRoomCode,
} from '../utils/studyRoomRegistry.js';

const BOTS = [
  { id: 'p1', name: 'Isadora', initials: 'I', color: '#8b7346' },
  { id: 'p2', name: 'Marcus', initials: 'M', color: '#4e6b66' },
  { id: 'p3', name: 'Priya', initials: 'P', color: '#8b2e2e' },
];

const TOOLS = [
  { id: 'pen', icon: <Pen size={14} />, label: 'Pen' },
  { id: 'erase', icon: <Eraser size={14} />, label: 'Eraser' },
  { id: 'line', icon: <Minus size={14} />, label: 'Line' },
  { id: 'rect', icon: <Square size={14} />, label: 'Rectangle' },
  { id: 'text', icon: <Type size={14} />, label: 'Text' },
];

const LOADING_STEPS = [
  'Securing session environment…',
  'Applying focus lockdown…',
  'Preparing whiteboard & timer…',
  'Entering extreme study mode…',
];

function StudyRoomLoader({ label, step }) {
  return (
    <div className="sr-loading">
      <Loader label={label} />
      <div className="sr-loading-steps">
        {LOADING_STEPS.map((s, i) => (
          <p key={s} className={`sr-loading-step${i <= step ? ' done' : ''}`}>
            {s}
          </p>
        ))}
      </div>
      <p className="sr-loading-warn">
        <Lock size={14} aria-hidden="true" />
        Navigation is locked until you force exit this session.
      </p>
    </div>
  );
}

function RoomSettingsPanel({ settings, onChange, onClose }) {
  const [draft, setDraft] = useState(settings);

  function apply() {
    onChange(draft);
    onClose();
  }

  return (
    <div className="sr-settings-overlay" onClick={onClose}>
      <div className="sr-settings-panel" onClick={(e) => e.stopPropagation()}>
        <header className="sr-settings-head">
          <h2>Session settings</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </header>
        <p className="sr-settings-note">Settings apply to this session only and reset when you exit.</p>
        <div className="sr-settings-grid">
          <label className="sr-settings-field">
            <span>Focus interval (min)</span>
            <input
              type="number"
              className="form-input"
              min={5}
              max={90}
              value={draft.focusMinutes}
              onChange={(e) => setDraft((d) => ({ ...d, focusMinutes: Number(e.target.value) }))}
            />
          </label>
          <label className="sr-settings-field">
            <span>Break interval (min)</span>
            <input
              type="number"
              className="form-input"
              min={1}
              max={30}
              value={draft.breakMinutes}
              onChange={(e) => setDraft((d) => ({ ...d, breakMinutes: Number(e.target.value) }))}
            />
          </label>
        </div>
        <div className="sr-settings-toggles">
          {[
            ['enableWhiteboard', 'Whiteboard'],
            ['enableChat', 'Room chat'],
            ['showPomodoro', 'Pomodoro timer'],
            ['blockNotifications', 'Block app notifications'],
          ].map(([key, label]) => (
            <label key={key} className="sr-settings-toggle">
              <input
                type="checkbox"
                checked={draft[key]}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={apply}>Apply settings</button>
      </div>
    </div>
  );
}

function Whiteboard({ enabled }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const startPt = useRef(null);
  const lastPt = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#f4f1ea');
  const [size, setSize] = useState(3);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const resize = () => {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0a0e13';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [enabled]);

  const pos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const pt = e.changedTouches?.[0] || e.touches?.[0] || e;
    return { x: pt.clientX - rect.left, y: pt.clientY - rect.top };
  };

  const onDown = (e) => {
    if (!enabled) return;
    drawing.current = true;
    const p = pos(e, canvasRef.current);
    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (!text) {
        drawing.current = false;
        return;
      }
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = color;
      ctx.font = `${size * 5 + 10}px Inter, sans-serif`;
      ctx.fillText(text, p.x, p.y);
      drawing.current = false;
      return;
    }
    startPt.current = p;
    lastPt.current = p;
  };

  const onMove = (e) => {
    if (!drawing.current || tool === 'text' || !enabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const p = pos(e, canvas);
    if (tool === 'pen' || tool === 'erase') {
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = tool === 'erase' ? '#0a0e13' : color;
      ctx.lineWidth = tool === 'erase' ? size * 5 : size;
      ctx.lineCap = 'round';
      ctx.stroke();
      lastPt.current = p;
    }
  };

  const onUp = (e) => {
    if (!drawing.current || !enabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const p = pos(e, canvas);
    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPt.current.x, startPt.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else if (tool === 'rect') {
      const w = p.x - startPt.current.x;
      const h = p.y - startPt.current.y;
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.strokeRect(startPt.current.x, startPt.current.y, w, h);
    }
    drawing.current = false;
  };

  if (!enabled) {
    return (
      <div className="sr-canvas-area sr-canvas-disabled">
        <p>Whiteboard disabled in session settings.</p>
      </div>
    );
  }

  return (
    <div className="sr-canvas-area">
      <div className="sr-tools" role="toolbar" aria-label="Drawing tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`sr-tool-btn${tool === t.id ? ' active' : ''}`}
            onClick={() => setTool(t.id)}
            title={t.label}
            aria-label={t.label}
            aria-pressed={tool === t.id}
          >
            {t.icon}
          </button>
        ))}
        <div className="sr-tool-sep" />
        <input type="color" className="sr-color-pick" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Stroke color" />
        <input
          type="number"
          className="sr-size-input"
          value={size}
          onChange={(e) => setSize(Math.max(1, Math.min(20, Number(e.target.value))))}
          min={1}
          max={20}
          aria-label="Stroke size"
        />
        <div className="sr-tool-sep" />
        <button
          className="sr-tool-btn"
          onClick={() => {
            const c = canvasRef.current;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#0a0e13';
            ctx.fillRect(0, 0, c.width, c.height);
          }}
          title="Clear canvas"
        >
          <Trash2 size={14} />
        </button>
        <button
          className="sr-tool-btn"
          onClick={() => {
            const a = document.createElement('a');
            a.download = `acad-whiteboard-${Date.now()}.png`;
            a.href = canvasRef.current.toDataURL();
            a.click();
          }}
          title="Export PNG"
        >
          <Download size={14} />
        </button>
      </div>
      <div className="sr-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="sr-canvas"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
          aria-label="Study room whiteboard"
          role="img"
        />
      </div>
    </div>
  );
}

function ActiveRoom({
  roomCode,
  mode,
  friendIds,
  settings,
  onSettingsChange,
  onForceExit,
  earnXP,
}) {
  const { members } = useStudyGroups();
  const invited = members.filter((m) => friendIds.includes(m.id));
  const participants =
    mode === 'solo'
      ? [{ id: 'you', name: 'You', initials: 'Y', color: '#a08855' }]
      : [
          { id: 'you', name: 'You', initials: 'Y', color: '#a08855' },
          ...invited.map((m) => ({
            id: m.id,
            name: m.name,
            initials: m.name[0],
            color: '#4e6b66',
          })),
          ...BOTS.slice(0, Math.max(0, 2 - invited.length)),
        ];

  const welcome = [
    {
      id: 'sys1',
      pid: 'sys',
      name: 'Room',
      color: 'var(--slate)',
      text:
        mode === 'solo'
          ? 'Solo extreme session active. All distractions are locked out. Force exit to leave.'
          : `Collaborative session with ${invited.length} invited friend${invited.length === 1 ? '' : 's'}. Stay focused — force exit to leave.`,
      time: '',
    },
  ];

  const [messages, setMessages] = useState(welcome);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [pomoState, setPomoState] = useState('idle');
  const [seconds, setSeconds] = useState(settings.focusMinutes * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [forceExitOpen, setForceExitOpen] = useState(false);
  const [forceExitText, setForceExitText] = useState('');
  const bottomRef = useRef(null);
  const startedAt = useRef(Date.now());
  const userMessageCount = useRef(0);

  useEffect(() => {
    setSeconds(settings.focusMinutes * 60);
  }, [settings.focusMinutes]);

  useEffect(() => {
    if (pomoState === 'idle' || !settings.showPomodoro) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          const next = pomoState === 'focus' ? 'break' : 'focus';
          setPomoState(next);
          const nextSecs = next === 'focus' ? settings.focusMinutes * 60 : settings.breakMinutes * 60;
          if (Notification.permission === 'granted') {
            new Notification('Acad Study Room', {
              body: next === 'break' ? 'Focus complete. Take your break.' : 'Break over. Back to focus.',
              icon: '/favicon.svg',
            });
          }
          return nextSecs;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomoState, settings.focusMinutes, settings.breakMinutes, settings.showPomodoro]);

  const togglePomo = () => {
    if (Notification.permission !== 'granted') Notification.requestPermission();
    if (pomoState === 'idle') {
      setPomoState('focus');
      setSeconds(settings.focusMinutes * 60);
    } else {
      setPomoState('idle');
      setSeconds(settings.focusMinutes * 60);
    }
  };

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const send = useCallback(() => {
    if (!input.trim() || !settings.enableChat) return;
    const msg = {
      id: crypto.randomUUID(),
      pid: 'you',
      name: 'You',
      color: '#f4f1ea',
      text: input,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((m) => [...m, msg]);
    setInput('');
    userMessageCount.current += 1;
    earnXP(5);
    if (mode === 'friends') {
      setTyping(true);
      const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
      const replies = [
        'Great point!',
        'Agreed. Adding that to my notes.',
        'That makes sense.',
        'Can you elaborate?',
      ];
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            pid: bot.id,
            name: bot.name,
            color: bot.color,
            text: replies[Math.floor(Math.random() * replies.length)],
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 1500 + Math.random() * 1000);
    }
  }, [input, earnXP, mode, settings.enableChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleForceExit = () => {
    if (forceExitText.trim().toUpperCase() !== 'FORCE EXIT') return;
    onForceExit({
      messageCount: userMessageCount.current,
      durationMin: Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)),
    });
  };

  return (
    <div className="sr-room sr-room-locked">
      <header className="sr-room-header">
        <span className="tag sr-lock-tag">
          <Lock size={10} aria-hidden="true" /> Extreme session
        </span>
        <span className="sr-room-code font-mono" aria-label={`Room code ${roomCode}`}>
          {roomCode}
        </span>
        <span className="sr-room-mode">
          {mode === 'solo' ? <User size={12} /> : <Users size={12} />}
          {mode === 'solo' ? 'Solo' : `${participants.length} in room`}
        </span>
        <div className="sr-participants" aria-label="Participants">
          {participants.map((p) => (
            <div key={p.id} className="sr-avatar" style={{ background: p.color }} title={p.name}>
              {p.initials}
            </div>
          ))}
        </div>
        <div className="sr-room-header-right">
          {settings.showPomodoro && (
            <div className="sr-pomo">
              <div>
                <div className="sr-pomo-label">{pomoState === 'break' ? 'Break' : 'Focus'}</div>
                <div className={`sr-pomo-time${pomoState === 'break' ? ' break' : ''}`}>{fmt(seconds)}</div>
              </div>
              <button className="sr-pomo-btn" onClick={togglePomo} type="button">
                {pomoState === 'idle' ? 'Start' : 'Stop'}
              </button>
            </div>
          )}
          <button type="button" className="sr-settings-btn" onClick={() => setShowSettings(true)} aria-label="Session settings">
            <Settings size={16} />
          </button>
          <button type="button" className="btn btn-ghost sr-force-exit-btn" onClick={() => setForceExitOpen(true)}>
            <AlertTriangle size={14} /> Force exit
          </button>
        </div>
      </header>

      <div className="sr-room-body">
        <Whiteboard enabled={settings.enableWhiteboard} />
        {settings.enableChat ? (
          <div className="sr-chat">
            <div className="sr-chat-head">Room chat · {participants.length} participant{participants.length === 1 ? '' : 's'}</div>
            <div className="sr-msgs" role="log" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className={`sr-msg${m.pid === 'you' ? ' own' : ''}`}>
                  <div className="sr-msg-meta">
                    <div className="sr-msg-avatar" style={{ background: m.color }}>{m.name[0]}</div>
                    <span className="sr-msg-name">{m.name}</span>
                    <span className="sr-msg-time">{m.time}</span>
                  </div>
                  <div className="sr-msg-text">{m.text}</div>
                </div>
              ))}
              {typing && <p className="sr-typing-ind">Someone is typing…</p>}
              <div ref={bottomRef} />
            </div>
            <div className="sr-chat-input-row">
              <input
                className="sr-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Message the room…"
              />
              <button className="sr-chat-send" onClick={send} type="button" aria-label="Send">
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="sr-chat sr-chat-disabled">
            <p>Chat disabled in session settings.</p>
          </div>
        )}
      </div>

      {showSettings && (
        <RoomSettingsPanel
          settings={settings}
          onChange={onSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {forceExitOpen && (
        <Modal
          title="Force exit extreme session?"
          body={
            <div className="sr-force-modal">
              <p>This ends your locked study session immediately. All whiteboard and chat data from this session will be lost.</p>
              <p className="sr-force-hint">Type <strong>FORCE EXIT</strong> to confirm.</p>
              <input
                className="form-input"
                value={forceExitText}
                onChange={(e) => setForceExitText(e.target.value)}
                placeholder="FORCE EXIT"
                autoFocus
              />
            </div>
          }
          confirmLabel="Force exit session"
          confirmClass="btn-danger"
          onConfirm={handleForceExit}
          onCancel={() => {
            setForceExitOpen(false);
            setForceExitText('');
          }}
          confirmDisabled={forceExitText.trim().toUpperCase() !== 'FORCE EXIT'}
        />
      )}
    </div>
  );
}

function SessionSummary({ stats, onNewSession }) {
  const roomCode = stats?.roomCode ?? '—';
  const duration = stats?.durationMin ?? 1;
  const messages = stats?.messageCount ?? 0;
  return (
    <main className="page sr-page anim-fade-in sr-summary-page">
      <div className="sr-end-card">
        <h2 className="sr-end-title">Session ended</h2>
        <p className="sr-end-sub">Extreme study mode deactivated. Session data has been cleared.</p>
        {[
          ['Room code', roomCode],
          ['Duration', `${duration} min`],
          ['Your messages', String(messages)],
        ].map(([k, v]) => (
          <div key={k} className="sr-stat-row">
            <span>{k}</span>
            <span className="sr-stat-val">{v}</span>
          </div>
        ))}
        <button className="btn btn-primary" type="button" onClick={onNewSession} style={{ marginTop: 24 }}>
          Start new session
        </button>
      </div>
    </main>
  );
}

export default function StudyRoom({
  setPage,
  initialCode = null,
  initialConfig = null,
  onLeave,
  onLockChange,
}) {
  const { earnXP, unlockAchievement } = useGame();
  const [phase, setPhase] = useState(initialCode ? 'loading' : 'lobby');
  const [roomCode, setRoomCode] = useState(initialCode || '');
  const [roomMeta, setRoomMeta] = useState(null);
  const [settings, setSettings] = useState({ ...DEFAULT_ROOM_SETTINGS });
  const [loadingStep, setLoadingStep] = useState(0);
  const [sessionStats, setSessionStats] = useState(null);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), 400 + i * 450),
    );
    const enter = setTimeout(() => {
      setPhase('room');
      onLockChange?.(true);
      unlockAchievement('whiteboard');
      earnXP(20);
    }, 400 + LOADING_STEPS.length * 450 + 300);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(enter);
    };
  }, [phase, earnXP, onLockChange, unlockAchievement]);

  useEffect(() => {
    if (initialCode && initialConfig) {
      setRoomCode(initialCode);
      setRoomMeta(initialConfig);
      setSettings({ ...DEFAULT_ROOM_SETTINGS, ...initialConfig.settings });
      setPhase('loading');
    } else if (initialCode) {
      const room = getRoom(initialCode);
      if (room) {
        setRoomCode(initialCode);
        setRoomMeta(room);
        setSettings({ ...DEFAULT_ROOM_SETTINGS, ...room.settings });
        setPhase('loading');
      } else if (validateRoomCode(initialCode)) {
        setRoomCode(initialCode);
        setRoomMeta(getRoom(initialCode));
        setPhase('loading');
      } else {
        setPhase('lobby');
      }
    }
  }, [initialCode, initialConfig]);

  useEffect(() => {
    if (phase !== 'room') return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  const finishSession = (stats) => {
    const endedCode = roomCode;
    unregisterRoom(roomCode);
    onLockChange?.(false);
    setSessionStats({ ...stats, roomCode: endedCode });
    setPhase('ended');
    setSettings({ ...DEFAULT_ROOM_SETTINGS });
    setRoomMeta(null);
    onLeave?.();
  };

  if (phase === 'loading') {
    return (
      <main className="page sr-page sr-page-locked">
        <StudyRoomLoader label="Entering study room…" step={loadingStep} />
      </main>
    );
  }

  if (phase === 'room' && roomCode) {
    return (
      <main className="page sr-page sr-page-locked">
        <ActiveRoom
          roomCode={roomCode}
          mode={roomMeta?.mode || 'solo'}
          friendIds={roomMeta?.friendIds || []}
          settings={settings}
          onSettingsChange={setSettings}
          onForceExit={finishSession}
          earnXP={earnXP}
        />
      </main>
    );
  }

  if (phase === 'ended') {
    return (
      <SessionSummary
        stats={sessionStats}
        onNewSession={() => {
          setSessionStats(null);
          setRoomCode('');
          setPage('study-groups');
        }}
      />
    );
  }

  return null;
}
