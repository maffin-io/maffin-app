import React from 'react';

export type StatisticsWidgetProps = {
  title: string,
  stats: React.JSX.Element | string,
  description: React.JSX.Element | string,
  className?: string,
  statsTextClass?: string,
};

export default function StatisticsWidget({
  title,
  stats,
  description,
  className = '',
  statsTextClass = '',
}: StatisticsWidgetProps): React.JSX.Element {
  return (
    <div className={`card ${className} p-6`}>
      <p>
        {title}
      </p>
      <p className={`text-2xl font-semibold my-3 ${statsTextClass}`}>{stats}</p>

      <span className="text-sm">
        {description}
      </span>
    </div>
  );
}
