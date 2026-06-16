/** Shown when VITE_APP_ENV=staging — sets tester expectations before production backend ships. */
export default function StagingBanner() {
  if (import.meta.env.VITE_APP_ENV !== 'staging') return null;

  return (
    <div className="staging-banner" role="status">
      <strong>Staging</strong>
      <span>
        {import.meta.env.VITE_SUPABASE_URL
          ? 'Cloud alpha — sign in to sync across devices. Demo password: demo'
          : 'Data stays on this device. Demo logins use password demo. Configure Supabase for cloud sync.'}
      </span>
    </div>
  );
}
