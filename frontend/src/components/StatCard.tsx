import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: string;
  color?: 'teal' | 'navy' | 'cyan' | 'emergency' | 'amber';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  color = 'teal',
  badge
}) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emergency':
        return {
          iconBg: 'bg-emergency-50 text-emergency-600',
          border: 'border-l-4 border-l-emergency-500',
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-50 text-cyan-600',
          border: 'border-l-4 border-l-cyan-500',
        };
      case 'navy':
        return {
          iconBg: 'bg-slate-100 text-navy-900',
          border: 'border-l-4 border-l-navy-900',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-600',
          border: 'border-l-4 border-l-amber-500',
        };
      default:
        return {
          iconBg: 'bg-teal-50 text-teal-600',
          border: 'border-l-4 border-l-teal-600',
        };
    }
  };

  const styles = getColorStyles();

  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md ${styles.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-lg ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-navy-950 tracking-tight">{value}</span>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium flex items-center">
          {subtitle}
        </p>
      )}
    </div>
  );
};
