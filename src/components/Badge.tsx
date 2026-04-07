import { LucideIcon } from "lucide-react";

export type BadgeVariant = 'default' | 'warning' | 'error';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'text-green-700',
  warning: 'text-amber-800 bg-amber-100',
  error:   'text-danger-text bg-danger-surface',
};

export function Badge({ label, variant = 'default', icon: Icon }: { label: string; variant?: BadgeVariant; icon?: LucideIcon }) {
  return (
    <span className={`inline-flex items-center gap-0.5 font-sans text-sm leading-4 rounded-sm ${variantClasses[variant]}`}>
      {label}{Icon && <Icon size={14} />}
    </span>
  );
}
