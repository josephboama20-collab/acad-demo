export default function Terms({ setPage }) {
  return (
    <main className="page legal-page anim-fade-in">
      <div className="container legal-wrap">
        <button type="button" className="btn btn-ghost" onClick={() => setPage('landing')}>← Back</button>
        <h1 className="legal-title">Terms of Use</h1>
        <p className="legal-updated">Last updated: June 2026</p>

        <section className="legal-section">
          <h2>Service</h2>
          <p>Acad helps you structure an academic comeback between commitments. You choose your recovery window, courses, and study tools.</p>
        </section>

        <section className="legal-section">
          <h2>Accounts</h2>
          <p>You are responsible for your credentials. One person per account. Demo accounts are for evaluation only.</p>
        </section>

        <section className="legal-section">
          <h2>Acceptable use</h2>
          <p>Do not abuse AI features, attempt to access other users&apos; data, or use the service for unlawful purposes.</p>
        </section>

        <section className="legal-section">
          <h2>Disclaimer</h2>
          <p>Acad is provided as-is during early access. We may change features, limits, or availability with notice where practical.</p>
        </section>

        <section className="legal-section">
          <h2>Contact</h2>
          <p>Questions: support@acad.app</p>
        </section>
      </div>
    </main>
  );
}
