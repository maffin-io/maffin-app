import React from 'react';

export type StatisticsWidgetProps = {
  title: string,
  stats: string,
  description: string,
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
    <div className={`${className} bg-gunmetal-700 rounded-sm p-6`}>
      <p>
        {title}
      </p>
      <p className={`${statsTextClass} text-2xl font-semibold my-3`}>{stats}</p>

      <span className="text-sm">
        {description}
      </span>
    </div>
  );
}
