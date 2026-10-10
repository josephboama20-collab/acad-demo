/** Shown when VITE_APP_ENV=staging — sets tester expectations before production backend ships. */
export default function StagingBanner() {
  if (import.meta.env.VITE_APP_ENV !== 'staging') return null;

  return (
    <div className="staging-banner" role="status">
      <strong>Staging</strong>
      <span>
        {import.meta.env.VITE_SUPABASE_URL
          ? 'Cloud alpha — demo password: demo'
          : 'Data stays on this device · demo password: demo'}
      </span>
    </div>
  );
}
