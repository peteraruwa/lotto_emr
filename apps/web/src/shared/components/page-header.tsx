import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ElementType;
  iconColor?: string;
  iconBg?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
  iconColor = 'text-hospital-600',
  iconBg = 'bg-hospital-50',
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 leading-tight truncate">{title}</h1>
          {description && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
