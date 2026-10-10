import { Moon, Sun, Sunset } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';

const THEME_META = {
  light: { icon: Sun, label: 'Light mode', short: 'Light' },
  twilight: { icon: Sunset, label: 'Twilight mode', short: 'Twilight' },
  dark: { icon: Moon, label: 'Dark mode', short: 'Dark' },
};

export default function ThemeToggle({ variant = 'dock' }) {
  const { theme, cycleTheme } = useTheme();
  const meta = THEME_META[theme] || THEME_META.twilight;
  const Icon = meta.icon;

  if (variant === 'dock-row') {
    return (
      <button
        type="button"
        className="dock-btn dock-meta"
        onClick={cycleTheme}
        aria-label={`${meta.label}. Click to switch theme.`}
        title={meta.label}
        id="btn-dock-theme"
      >
        <span className="dock-icon" aria-hidden="true">
          <Icon size={18} strokeWidth={2} />
        </span>
        <span className="dock-label" aria-hidden="true">{meta.short}</span>
        <span className="dock-tooltip" aria-hidden="true">{meta.label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--single theme-toggle--${variant}`}
      onClick={cycleTheme}
      aria-label={`${meta.label}. Click to switch theme.`}
      title={meta.label}
    >
      <Icon size={variant === 'dock' ? 18 : 16} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
