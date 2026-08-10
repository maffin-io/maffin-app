import React from 'react';
import { TooltipRenderProps } from 'react-joyride';

export default function CustomTooltip({
  step,
  tooltipProps,
}: TooltipRenderProps): React.JSX.Element {
  return (
    <div
      className="card m-0 max-w-md text-sm rounded-md"
      {...tooltipProps}
    >
      {step.content}
    </div>
  );
}
