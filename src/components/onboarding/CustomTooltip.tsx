import React from 'react';
import Joyride, {
  TooltipRenderProps,
} from 'react-joyride';

export default function CustomTooltip({
  step,
  tooltipProps,
}: TooltipRenderProps): JSX.Element {
  return (
    <div
      className="mx-auto w-1/2 bg-gunmetal-700 text-sm p-5 rounded-md"
      {...tooltipProps}
    >
      {step.content}
    </div>
  );
}
