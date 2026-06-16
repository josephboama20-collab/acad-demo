import { useGame } from '../contexts/GameContext.jsx';

const LEVEL_TITLES = [
  'Initiate',
  'Apprentice Scholar',
  'Dedicated Learner',
  'Consistent Mind',
  'Journeyman',
  'Analytical Thinker',
  'Advanced Practitioner',
  'Elite Scholar',
  'Distinguished Academic',
  'Apex Conditioner',
];

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
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transition: 'stroke-dasharray 0.5s var(--ease)',
          }}
        />
      </svg>
    </div>
  );
}

function LevelBadge({ level, xpInLevel }) {
  const pct = (xpInLevel / 1000) * 100;
  const r = 67 / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="ch-level-badge">
      <div className="ch-level-ring">
        <svg viewBox="0 0 72 72" width={72} height={72}>
          <circle cx={36} cy={36} r={r} fill="none" stroke="var(--border-dim)" strokeWidth={5} />
          <circle
            cx={36}
            cy={36}
            r={r}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={5}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ * 0.25}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '36px 36px',
              transition: 'stroke-dasharray 0.6s var(--ease)',
            }}
          />
        </svg>
        <div className="ch-level-inner">
          <span className="ch-level-num">{level}</span>
          <span className="ch-level-lbl">LVL</span>
        </div>
      </div>
      <span className="ch-xp-lbl">{xpInLevel}/1000 XP</span>
    </div>
  );
}

export default function Challenges() {
  const { xp, level, xpInLevel, challenges, achievements, allAchievements, leaderboard } = useGame();

  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  return (
    <main className="page ch-page anim-fade-in">
      <div className="ch-wrap">
        <header className="ch-header">
          <div>
            <p className="ch-kicker">Progress</p>
            <h1 className="ch-title">Challenges and ranks</h1>
            <p className="ch-sub">
              <span className="tag">{title}</span>
              &nbsp;·&nbsp; {xp.toLocaleString()} total XP &nbsp;·&nbsp; {achievements.length} achievement
              {achievements.length === 1 ? '' : 's'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <LevelBadge level={level} xpInLevel={xpInLevel} />
          </div>
        </header>

        <section aria-labelledby="ch-challenges-hd">
          <p id="ch-challenges-hd" className="ch-section-hd">
            Weekly Challenges
          </p>
          <div className="ch-cards">
            {challenges.map((ch) => {
              const pct = Math.round((ch.progress / ch.target) * 100);
              return (
                <div key={ch.id} className={`ch-card${ch.completed ? ' done' : ''}`}>
                  <span className="ch-card-xp">+{ch.xpReward} XP</span>
                  <div className="ch-card-icon">{ch.icon}</div>
                  <p className="ch-card-title">{ch.title}</p>
                  <p className="ch-card-desc">{ch.desc}</p>
                  <div className="ch-prog-wrap">
                    {ch.completed ? (
                      <span className="ch-done-check">✅</span>
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

        <section aria-labelledby="ch-lb-hd">
          <p id="ch-lb-hd" className="ch-section-hd">
            Weekly Leaderboard
          </p>
          <div className="ch-leaderboard">
            {leaderboard.map((row) => (
              <div key={row.rank} className={`ch-lb-row${row.isUser ? ' you' : ''}`}>
                <span className={`ch-lb-rank${row.rank <= 3 ? ' top' : ''}`}>
                  {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : row.rank}
                </span>
                <span className="ch-lb-badge">{row.badge}</span>
                <span className="ch-lb-name">
                  {row.name}
                  {row.isUser ? ' (You)' : ''}
                </span>
                <span className="ch-lb-lvl">Lv.{row.level}</span>
                <span className="ch-lb-xp">{row.xp?.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ch-ach-hd">
          <p id="ch-ach-hd" className="ch-section-hd">
            Achievements ({achievements.length}/{allAchievements.length})
          </p>
          <div className="ch-achievements">
            {allAchievements.map((ach) => {
              const unlocked = achievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`ch-ach-card${unlocked ? ' unlocked' : ' locked'}`}
                  title={unlocked ? ach.desc : 'Locked'}
                >
                  <div className="ch-ach-icon">{ach.icon}</div>
                  <div className="ch-ach-title">{ach.title}</div>
                  <div className="ch-ach-desc">{unlocked ? ach.desc : '???'}</div>
                  {unlocked && <div className="ch-ach-xp">+{ach.xp} XP</div>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
