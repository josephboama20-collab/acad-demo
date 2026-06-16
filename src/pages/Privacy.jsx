export default function Privacy({ setPage }) {
  return (
    <main className="page legal-page anim-fade-in">
      <div className="container legal-wrap">
        <button type="button" className="btn btn-ghost" onClick={() => setPage('landing')}>← Back</button>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated: June 2026</p>

        <section className="legal-section">
          <h2>What we collect</h2>
          <p>When you create an account we store your email, display name, and study data you enter: courses, flashcards, wellness check-ins, projects, and usage metrics needed to run Acad.</p>
        </section>

        <section className="legal-section">
          <h2>How we use it</h2>
          <p>Your data powers personalised study recommendations, progress reports, and AI study sessions. We do not sell your personal information.</p>
        </section>

        <section className="legal-section">
          <h2>Wellness data</h2>
          <p>Energy, mood, and focus logs are for your insights only. Acad is not a medical service. Do not use it as a substitute for professional health advice.</p>
        </section>

        <section className="legal-section">
          <h2>AI processing</h2>
          <p>Messages you send to AI Buddy may be processed by our AI provider to generate responses. Do not submit sensitive personal information in chat.</p>
        </section>

        <section className="legal-section">
          <h2>Your rights</h2>
          <p>You may export or delete your account from Settings. Deletion removes your cloud data permanently.</p>
        </section>

        <section className="legal-section">
          <h2>Contact</h2>
          <p>Questions: privacy@acad.app</p>
        </section>
      </div>
    </main>
  );
}
