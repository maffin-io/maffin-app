import React from 'react';

export type StatisticsWidgetProps = {
  title: string,
  stats: string,
  description: string,
  statsTextClass?: string,
};

export default function StatisticsWidget({
  title,
  stats,
  description,
  statsTextClass = '',
}: StatisticsWidgetProps): JSX.Element {
  return (
    <div className="bg-gunmetal-700 rounded-sm mx-6 p-6">
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
