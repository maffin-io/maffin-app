import React from 'react';
import { Tooltip, ITooltip } from 'react-tooltip';

export type TooltipProps = ITooltip & React.PropsWithChildren;

export default function CustomTooltip({
  children,
  className,
  ...props
}: TooltipProps): JSX.Element {
  return (
    <Tooltip
      className={`!bg-light-50 !text-light-600/90 dark:!bg-dark-900 dark:!text-slate-200 shadow-xl !rounded-lg !z-50 !opacity-100 whitespace-pre-wrap !overflow-visible ${className}`}
      delayShow={200}
      {...props}
    >
      {children}
    </Tooltip>
  );
}
