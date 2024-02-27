import React from 'react';

export type StatisticsWidgetProps = {
  title: string,
  stats: JSX.Element | string,
  description: JSX.Element | string,
  className?: string,
  statsTextClass?: string,
};

export default function StatisticsWidget({
  title,
  stats,
  description,
  className = '',
  statsTextClass = '',
}: StatisticsWidgetProps): JSX.Element {
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
