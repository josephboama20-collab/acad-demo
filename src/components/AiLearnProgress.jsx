import { getAiLearnProgressMessage } from '../utils/academicProfileAI.js';

export default function AiLearnProgress({ loading, elapsedSeconds = 0, error, onRetry, summary }) {
  const progressPct = loading ? Math.min(95, Math.round((elapsedSeconds / 90) * 100)) : 100;

  return (
    <div className="ai-learn-panel">
      {loading && (
        <>
          <div className="lo-spinner" aria-hidden="true" />
          <p className="ai-learn-status">{getAiLearnProgressMessage(elapsedSeconds)}</p>
          <div className="ai-learn-progress" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
            <div className="ai-learn-progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="ob-hint ai-learn-elapsed">{elapsedSeconds > 0 ? `${elapsedSeconds}s elapsed` : 'Starting…'}</p>
        </>
      )}
      {summary}
      {error && (
        <div className="ai-learn-error" role="alert">
          <p className="form-error">{error}</p>
          {onRetry && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
              Retry AI learning
            </button>
          )}
        </div>
      )}
    </div>
  );
}
