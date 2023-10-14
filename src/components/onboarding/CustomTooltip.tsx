import React from 'react';
import { TooltipRenderProps } from 'react-joyride';

export default function CustomTooltip({
  step,
  tooltipProps,
}: TooltipRenderProps): JSX.Element {
  return (
    <div
      className="card m-0 mx-auto w-1/2 text-sm rounded-md"
      {...tooltipProps}
    >
      {step.content}
    </div>
  );
}
