import { useEffect, useRef, useState } from 'react';
import { Link2, Lock, MessageCircle, Plus, Settings, Shield, Trash2, User, UserMinus, Users } from 'lucide-react';
import { useStudyGroups } from '../contexts/StudyGroupsContext.jsx';
import ChallengesPanel from './ChallengesPanel.jsx';
import {
  DEFAULT_ROOM_SETTINGS,
  genRoomCode,
  getRoom,
  registerRoom,
  validateRoomCode,
} from '../utils/studyRoomRegistry.js';

const SIDEBAR_VIEWS = [
  { id: 'groups', label: 'Chat' },
  { id: 'dms', label: 'Direct Messages' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'settings', label: 'Settings' },
];

function RoomsPane({ setPage }) {
  const { members } = useStudyGroups();
  const [view, setView] = useState('home');
  const [mode, setMode] = useState('solo');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [code, setCode] = useState('');
  const [created, setCreated] = useState('');
  const [joinError, setJoinError] = useState('');
  const [settings, setSettings] = useState({ ...DEFAULT_ROOM_SETTINGS });

  function toggleFriend(id) {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function createRoom() {
    const roomCode = genRoomCode();
    const meta = registerRoom({
      code: roomCode,
      mode,
      friendIds: mode === 'friends' ? selectedFriends : [],
      settings,
    });
    setCreated(roomCode);
    setView('created');
    return meta;
  }

  function enterRoom(roomCode, config = null) {
    if (roomCode.length !== 6) return;
    if (!validateRoomCode(roomCode)) {
      setJoinError('Room not found. Check the code or create a new room.');
      return;
    }
    setJoinError('');
    const room = getRoom(roomCode);
    setPage('study-room', { code: roomCode, config: config || room });
  }

  if (view === 'create') {
    return (
      <div className="sg-rooms-pane">
        <p className="sg-pane-title">Create study room</p>
        <p className="sg-pane-desc">Configure an extreme focus session. Navigation locks until you force exit.</p>

        <section className="sr-create-section">
          <p className="sg-settings-label">Session type</p>
          <div className="sr-mode-grid">
            <button
              type="button"
              className={`sr-mode-card${mode === 'solo' ? ' active' : ''}`}
              onClick={() => setMode('solo')}
            >
              <User size={20} />
              <span className="sr-mode-title">Go solo</span>
              <span className="sr-mode-desc">Locked focus session. Just you and the material.</span>
            </button>
            <button
              type="button"
              className={`sr-mode-card${mode === 'friends' ? ' active' : ''}`}
              onClick={() => setMode('friends')}
            >
              <Users size={20} />
              <span className="sr-mode-title">With friends</span>
              <span className="sr-mode-desc">Invite workspace members into the session.</span>
            </button>
          </div>
        </section>

        {mode === 'friends' && (
          <section className="sr-create-section">
            <p className="sg-settings-label">Invite friends</p>
            {members.length === 0 ? (
              <p className="sg-pane-hint">Add members to your workspace first (Chat tab → invite).</p>
            ) : (
              <div className="sr-friend-picks">
                {members.map((m) => (
                  <label key={m.id} className={`sr-friend-pick${selectedFriends.includes(m.id) ? ' on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(m.id)}
                      onChange={() => toggleFriend(m.id)}
                    />
                    <Avatar name={m.name} />
                    <span>{m.name}</span>
                  </label>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="sr-create-section">
          <p className="sg-settings-label">Session settings</p>
          <div className="sr-settings-grid">
            <label className="sr-settings-field">
              <span>Focus (min)</span>
              <input
                type="number"
                className="form-input"
                min={5}
                max={90}
                value={settings.focusMinutes}
                onChange={(e) => setSettings((s) => ({ ...s, focusMinutes: Number(e.target.value) }))}
              />
            </label>
            <label className="sr-settings-field">
              <span>Break (min)</span>
              <input
                type="number"
                className="form-input"
                min={1}
                max={30}
                value={settings.breakMinutes}
                onChange={(e) => setSettings((s) => ({ ...s, breakMinutes: Number(e.target.value) }))}
              />
            </label>
          </div>
          <div className="sr-settings-toggles">
            {[
              ['enableWhiteboard', 'Whiteboard'],
              ['enableChat', 'Room chat'],
              ['showPomodoro', 'Pomodoro timer'],
            ].map(([key, label]) => (
              <label key={key} className="sr-settings-toggle">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="sr-create-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setView('home')}>Back</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={createRoom}
            disabled={mode === 'friends' && members.length > 0 && selectedFriends.length === 0}
          >
            Generate room code
          </button>
        </div>
      </div>
    );
  }

  if (view === 'created' && created) {
    return (
      <div className="sg-rooms-pane">
        <p className="sg-pane-title">Room ready</p>
        <p className="sg-pane-desc">Share this code with friends. Settings reset when the session ends.</p>
        <div className="sr-code-display card">
          <p className="card-label">Room code</p>
          <p className="sr-code-big font-mono">{created}</p>
          <p className="sr-code-mode">{mode === 'solo' ? 'Solo session' : `With ${selectedFriends.length} friend(s)`}</p>
        </div>
        <div className="sr-create-actions">
          <button type="button" className="btn btn-outline" onClick={() => { setView('home'); setCreated(''); }}>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => enterRoom(created, getRoom(created))}
          >
            Enter room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sg-rooms-pane">
      <p className="sg-pane-title">Extreme study rooms</p>
      <p className="sg-pane-desc">
        Locked focus environments for deep work. No app navigation until you force exit. Every session starts fresh.
      </p>
      <div className="sg-rooms-grid">
        <div className="card sg-room-card">
          <p className="card-label">Create</p>
          <p className="sg-pane-hint" style={{ marginBottom: 12 }}>Solo or with friends. Customize timer and tools.</p>
          <button className="btn btn-primary" type="button" onClick={() => setView('create')}>
            Create room
          </button>
        </div>
        <div className="card sg-room-card">
          <p className="card-label">Join</p>
          <input
            className="form-input sr-code-input"
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setJoinError(''); }}
            placeholder="000000"
            maxLength={6}
            aria-label="Room code"
          />
          {joinError && <p className="form-error">{joinError}</p>}
          <button className="btn btn-outline" type="button" disabled={code.length !== 6} onClick={() => enterRoom(code)}>
            Join room
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }) {
  return <span className="sg-avatar">{name?.[0]?.toUpperCase() || '?'}</span>;
}

function LockedPane({ title, desc }) {
  return (
    <div className="sg-empty-pane">
      <Lock size={32} strokeWidth={1.5} />
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function InviteComposer() {
  const { members, suggestedMembers, addMember } = useStudyGroups();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function invite(addr, name) {
    if (addMember(addr, name)) {
      setEmail('');
      setError('');
    } else {
      setError('Could not add member. Check the email.');
    }
  }

  return (
    <div className="sg-invite-pane">
      <p className="sg-pane-title">Invite to your workspace</p>
      <p className="sg-pane-desc">
        Add at least one other Acad user to unlock group chat, study rooms, and challenges.
      </p>
      <div className="sg-compose-row">
        <input
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="classmate@university.edu"
          aria-label="Member email"
        />
        <button className="btn btn-primary" type="button" onClick={() => invite(email)} disabled={!email.trim()}>
          Invite
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      <p className="sg-quick-label">Quick add</p>
      <div className="sg-quick-row">
        {suggestedMembers.map((m) => (
          <button key={m.email} type="button" className="btn btn-outline" onClick={() => invite(m.email, m.name)}>
            {m.name}
          </button>
        ))}
      </div>
      {members.length > 0 && (
        <ul className="sg-roster">
          {members.map((m) => (
            <li key={m.id} className="sg-roster-item">
              <Avatar name={m.name} />
              <div className="sg-roster-info">
                <span className="sg-roster-name">{m.name}</span>
                <span className="sg-roster-email">{m.email}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GroupChatPane({ onOpenSettings }) {
  const { hasPeers, activeGroup, groups, messages, sendGroupMessage, shareLink } = useStudyGroups();
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const bottomRef = useRef(null);
  const list = activeGroup ? messages[activeGroup.id] || [] : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [list.length]);

  if (!hasPeers) {
    return <InviteComposer />;
  }

  return (
    <div className="sg-chat-pane">
      <header className="sg-chat-head">
        <div>
          <p className="sg-chat-title">{activeGroup?.name || 'Select a group'}</p>
          <p className="sg-chat-meta">
            {activeGroup ? `${activeGroup.memberIds.length + 1} members` : 'Pick a study group from the sidebar'}
          </p>
        </div>
        <div className="sg-chat-head-actions">
          {activeGroup && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenSettings} title="Group settings">
              <Settings size={14} />
            </button>
          )}
        </div>
      </header>

      {!activeGroup && groups.length > 0 && (
        <p className="sg-pane-hint">Select a study group on the left to open the conversation.</p>
      )}

      {activeGroup && (
        <>
          <div className="sg-thread">
            {list.length === 0 && (
              <p className="sg-thread-empty">No messages yet. Say hello to your study group.</p>
            )}
            {list.map((m) => (
              <div key={m.id} className={`sg-bubble-row${m.sender === 'You' ? ' outgoing' : ''}`}>
                {m.sender !== 'You' && <Avatar name={m.sender} />}
                <div className={`sg-bubble${m.sender === 'You' ? ' outgoing' : ''}`}>
                  {m.sender !== 'You' && <span className="sg-bubble-sender">{m.sender}</span>}
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="sg-compose">
            <textarea
              className="form-input sg-compose-input"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (text.trim()) {
                    sendGroupMessage(activeGroup.id, text);
                    setText('');
                  }
                }
              }}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => { sendGroupMessage(activeGroup.id, text); setText(''); }}
              disabled={!text.trim()}
            >
              Send
            </button>
          </div>
          <div className="sg-compose-row sg-link-row">
            <Link2 size={16} />
            <input className="form-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a link to share" />
            <button className="btn btn-outline" type="button" onClick={() => { shareLink(activeGroup.id, link); setLink(''); }} disabled={!link.trim()}>
              Share
            </button>
          </div>
        </>
      )}

      {groups.length === 0 && <p className="sg-pane-hint">Create a study group to start messaging.</p>}
    </div>
  );
}

function DmPane() {
  const { hasPeers, members, dms, sendDm, activeDmId, setActiveDmId } = useStudyGroups();
  const [text, setText] = useState('');
  const active = members.find((m) => m.id === activeDmId) || members[0];
  const list = active ? dms[active.id] || [] : [];

  if (!hasPeers) {
    return <LockedPane title="Direct messages locked" desc="Add Acad users to your workspace to send direct messages." />;
  }

  return (
    <div className="sg-chat-pane">
      <header className="sg-chat-head">
        <p className="sg-chat-title">{active ? active.name : 'Direct messages'}</p>
        <p className="sg-chat-meta">Private conversation with {active?.email || 'a workspace member'}</p>
      </header>
      {active && (
        <>
          <div className="sg-thread">
            {list.map((m) => (
              <div key={m.id} className={`sg-bubble-row${m.sender === 'You' ? ' outgoing' : ''}`}>
                <div className={`sg-bubble${m.sender === 'You' ? ' outgoing' : ''}`}>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="sg-compose">
            <input className="form-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${active.name}...`} />
            <button className="btn btn-primary" type="button" onClick={() => { sendDm(active.id, text); setText(''); }} disabled={!text.trim()}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GroupSettingsPane() {
  const {
    groups,
    activeGroup,
    createGroup,
    updateGroupName,
    removeMemberFromGroup,
    removeMemberFromWorkspace,
    promoteToAdmin,
    deleteGroup,
    isGroupAdmin,
    getGroupRoster,
    addMember,
    suggestedMembers,
    hasPeers,
  } = useStudyGroups();
  const [nameDraft, setNameDraft] = useState(activeGroup?.name || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setNameDraft(activeGroup?.name || '');
    setConfirmDelete(false);
  }, [activeGroup?.id, activeGroup?.name]);

  if (!activeGroup && groups.length === 0) {
    return (
      <div className="sg-settings-pane">
        <p className="sg-pane-title">Group settings</p>
        <p className="sg-pane-desc">Create a study group to manage members and admins.</p>
        <button type="button" className="btn btn-primary" onClick={() => createGroup('My study group')}>
          <Plus size={14} /> Create group
        </button>
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="sg-settings-pane">
        <p className="sg-pane-title">Group settings</p>
        <p className="sg-pane-hint">Select a study group on the left to manage it.</p>
      </div>
    );
  }

  const admin = isGroupAdmin(activeGroup.id);
  const roster = getGroupRoster(activeGroup);

  function saveName() {
    if (!admin || !nameDraft.trim()) return;
    updateGroupName(activeGroup.id, nameDraft);
  }

  function invite(addr, displayName) {
    if (!admin) return;
    if (addMember(addr, displayName, activeGroup.id)) {
      setInviteEmail('');
      setInviteError('');
    } else {
      setInviteError('Could not add member. They may already be in your workspace.');
    }
  }

  return (
    <div className="sg-settings-pane">
      <header className="sg-chat-head">
        <div>
          <p className="sg-chat-title">{activeGroup.name}</p>
          <p className="sg-chat-meta">{admin ? 'You are a group admin' : 'Member view'}</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => createGroup('New study group')}>
          <Plus size={14} /> New group
        </button>
      </header>

      <section className="sg-settings-section">
        <p className="sg-settings-label">Group name</p>
        <div className="sg-compose-row">
          <input
            className="form-input"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            disabled={!admin}
            aria-label="Group name"
          />
          <button type="button" className="btn btn-primary" onClick={saveName} disabled={!admin || !nameDraft.trim()}>
            Save
          </button>
        </div>
      </section>

      <section className="sg-settings-section">
        <p className="sg-settings-label">Members ({roster.length})</p>
        <ul className="sg-settings-roster">
          {roster.map((member) => {
            const isAdmin = activeGroup.adminIds.includes(member.id);
            return (
              <li key={member.id} className="sg-settings-member">
                <Avatar name={member.name} />
                <div className="sg-roster-info">
                  <span className="sg-roster-name">
                    {member.name}
                    {member.isSelf && ' (you)'}
                  </span>
                  <span className="sg-roster-email">{member.email}</span>
                </div>
                {isAdmin && (
                  <span className="sg-admin-badge">
                    <Shield size={12} /> Admin
                  </span>
                )}
                {admin && !member.isSelf && (
                  <div className="sg-member-actions">
                    {!isAdmin && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => promoteToAdmin(activeGroup.id, member.id)}
                        title="Make admin"
                      >
                        <Shield size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm sg-danger-btn"
                      onClick={() => removeMemberFromGroup(activeGroup.id, member.id)}
                      title="Remove from group"
                    >
                      <UserMinus size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm sg-danger-btn"
                      onClick={() => removeMemberFromWorkspace(member.id)}
                      title="Remove from workspace"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {admin && (
        <section className="sg-settings-section">
          <p className="sg-settings-label">Invite to this group</p>
          <p className="sg-pane-desc">Add Acad users to your workspace and this group.</p>
          <div className="sg-compose-row">
            <input
              className="form-input"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="classmate@university.edu"
              aria-label="Invite email"
            />
            <button type="button" className="btn btn-primary" onClick={() => invite(inviteEmail)} disabled={!inviteEmail.trim()}>
              Invite
            </button>
          </div>
          {inviteError && <p className="form-error">{inviteError}</p>}
          {!hasPeers && (
            <div className="sg-quick-row" style={{ marginTop: 12 }}>
              {suggestedMembers.map((m) => (
                <button key={m.email} type="button" className="btn btn-outline" onClick={() => invite(m.email, m.name)}>
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {admin && (
        <section className="sg-settings-section sg-settings-danger">
          <p className="sg-settings-label">Danger zone</p>
          {!confirmDelete ? (
            <button type="button" className="btn btn-outline sg-danger-outline" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Delete group
            </button>
          ) : (
            <div className="sg-delete-confirm">
              <p>Delete &quot;{activeGroup.name}&quot;? Messages in this group will be lost.</p>
              <div className="sg-delete-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary sg-danger-outline"
                  onClick={() => {
                    deleteGroup(activeGroup.id);
                    setConfirmDelete(false);
                  }}
                >
                  Confirm delete
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function StudyGroups({ setPage }) {
  const [view, setView] = useState('groups');
  const { hasPeers, groups, members, activeGroup, activeDmId, setActiveGroupId, setActiveDmId } = useStudyGroups();

  return (
    <main className="page fc-page sg-page anim-fade-in">
      <div className="fc-wrap">
        <header className="fc-header">
          <div>
            <p className="fc-kicker">Groups</p>
            <h1 className="fc-title">Study groups</h1>
            <p className="fc-sub">
              Message classmates, share links, run extreme study rooms, and tackle challenges together.
              {!hasPeers && ' Invite members to unlock group chat and challenges.'}
            </p>
          </div>
          <div className="fc-tabs" role="tablist" aria-label="Study group sections">
            {SIDEBAR_VIEWS.map((v) => {
              const locked = v.id === 'challenges' && !hasPeers;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={view === v.id}
                  className={`fc-tab${view === v.id ? ' active' : ''}${locked ? ' locked' : ''}`}
                  onClick={() => setView(v.id)}
                >
                  {v.label}
                  {locked && v.id !== 'challenges' && <Lock size={12} className="sg-tab-lock" />}
                </button>
              );
            })}
          </div>
        </header>

        <div className={`sg-messenger${(view !== 'groups' && view !== 'dms' && view !== 'settings') || !hasPeers ? ' sg-messenger-full' : ''}`}>
          <aside className="sg-sidebar">
            {((view === 'groups' || view === 'settings') && hasPeers) || (view === 'dms' && hasPeers) ? (
              <div className="sg-conv-list">
                <p className="sg-conv-label">
                  {view === 'settings' ? 'Your groups' : view === 'dms' ? 'Members' : 'Study groups'}
                </p>
                {view === 'dms' ? (
                  members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`sg-conv-item${activeDmId === m.id || (!activeDmId && members[0]?.id === m.id) ? ' active' : ''}`}
                      onClick={() => setActiveDmId(m.id)}
                    >
                      <Avatar name={m.name} />
                      <span className="sg-conv-name">{m.name}</span>
                    </button>
                  ))
                ) : (
                  groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`sg-conv-item${activeGroup?.id === g.id ? ' active' : ''}`}
                      onClick={() => {
                        setActiveGroupId(g.id);
                        if (view === 'settings') setView('settings');
                      }}
                    >
                      <span className="sg-conv-icon">
                        {view === 'settings' ? <Settings size={16} /> : <MessageCircle size={16} />}
                      </span>
                      <span className="sg-conv-name">{g.name}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </aside>

          <section className="sg-main">
            {view === 'groups' && <GroupChatPane onOpenSettings={() => setView('settings')} />}
            {view === 'dms' && <DmPane />}
            {view === 'rooms' && <RoomsPane setPage={setPage} />}
            {view === 'challenges' && (hasPeers ? <div className="sg-challenges-pane"><ChallengesPanel /></div> : <LockedPane title="Challenges locked" desc="Add Acad users to unlock weekly group challenges." />)}
            {view === 'settings' && <GroupSettingsPane />}
          </section>
        </div>
      </div>
    </main>
  );
}
