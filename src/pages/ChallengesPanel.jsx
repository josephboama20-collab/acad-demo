import { useMemo } from 'react';
import { useGame } from '../contexts/GameContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useStudyGroups } from '../contexts/StudyGroupsContext.jsx';

function ProgressRing({ pct, size = 48, stroke = 4, color = 'var(--gold)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="ch-prog-ring">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-dim)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.5s var(--ease)' }}
        />
      </svg>
    </div>
  );
}

function stableMemberStats(member) {
  const key = member.email || member.id || member.name || '';
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 997;
  }
  return {
    streak: 3 + (hash % 14),
    xp: 800 + (hash % 1200),
  };
}

/** Challenges panel embedded in Study Groups. */
export default function ChallengesPanel() {
  const { challenges, achievements, allAchievements, xp, level } = useGame();
  const { streak, user } = useAuth();
  const { activeGroup, getGroupRoster } = useStudyGroups();

  const board = useMemo(() => {
    const roster = activeGroup ? getGroupRoster(activeGroup) : [];
    const rows = roster.map((member) => {
      if (member.isSelf) {
        return {
          id: member.id,
          name: user?.name || 'You',
          isUser: true,
          streak: streak.current ?? 0,
          xp,
          level,
          badge: streak.current >= 7 ? '🔥' : '📖',
        };
      }
      const stats = stableMemberStats(member);
      return {
        id: member.id,
        name: member.name,
        isUser: false,
        streak: stats.streak,
        xp: stats.xp,
        level: Math.floor(stats.xp / 1000) + 1,
        badge: stats.streak >= 10 ? '🔥' : stats.streak >= 5 ? '🎯' : '📖',
      };
    });

    return rows
      .sort((a, b) => b.streak - a.streak || b.xp - a.xp)
      .map((row, i) => ({ ...row, rank: i + 1 }));
  }, [activeGroup, getGroupRoster, user?.name, streak.current, xp, level]);

  return (
    <div className="sg-challenges">
      <section aria-labelledby="ch-challenges-hd">
        <p id="ch-challenges-hd" className="ch-section-hd">Weekly challenges</p>
        <div className="ch-cards">
          {challenges.map((ch) => {
            const pct = Math.round((ch.progress / ch.target) * 100);
            return (
              <div key={ch.id} className={`ch-card${ch.completed ? ' done' : ''}`}>
                <div className="ch-card-icon">{ch.icon}</div>
                <p className="ch-card-title">{ch.title}</p>
                <p className="ch-card-desc">{ch.desc}</p>
                <div className="ch-prog-wrap">
                  {ch.completed ? (
                    <span className="ch-done-check">✓</span>
                  ) : (
                    <ProgressRing pct={pct} />
                  )}
                  <div>
                    <div className="ch-prog-pct">
                      {ch.completed ? 'Complete' : `${ch.progress} / ${ch.target} ${ch.unit}`}
                    </div>
                    {!ch.completed && <div className="ch-prog-nums">{pct}%</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="ch-lb-hd" style={{ marginTop: 28 }}>
        <p id="ch-lb-hd" className="ch-section-hd">Group leaderboard</p>
        {board.length === 0 ? (
          <p className="ch-lb-empty">Add members to your study group to see the leaderboard.</p>
        ) : (
          <div className="ch-leaderboard">
            {board.map((row) => (
              <div key={row.id} className={`ch-lb-row${row.isUser ? ' you' : ''}`}>
                <span className={`ch-lb-rank${row.rank <= 3 ? ' top' : ''}`}>
                  {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : row.rank}
                </span>
                <span className="ch-lb-badge">{row.badge}</span>
                <span className="ch-lb-name">{row.name}{row.isUser ? ' (You)' : ''}</span>
                <span className="ch-lb-streak font-mono">{row.streak} day streak</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="ch-ach-hd" style={{ marginTop: 28 }}>
        <p id="ch-ach-hd" className="ch-section-hd">Achievements ({achievements.length}/{allAchievements.length})</p>
        <div className="ch-achievements">
          {allAchievements.map((ach) => {
            const unlocked = achievements.includes(ach.id);
            return (
              <div key={ach.id} className={`ch-ach-card${unlocked ? ' unlocked' : ' locked'}`} title={unlocked ? ach.desc : 'Locked'}>
                <div className="ch-ach-icon">{ach.icon}</div>
                <div className="ch-ach-title">{ach.title}</div>
                <div className="ch-ach-desc">{unlocked ? ach.desc : '???'}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
