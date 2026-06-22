import { Moon, Sun, Sunset } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';

const THEME_META = {
  light: { icon: Sun, label: 'Light mode' },
  twilight: { icon: Sunset, label: 'Twilight mode' },
  dark: { icon: Moon, label: 'Dark mode' },
};

export default function ThemeToggle({ variant = 'dock' }) {
  const { theme, cycleTheme } = useTheme();
  const meta = THEME_META[theme] || THEME_META.twilight;
  const Icon = meta.icon;

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
