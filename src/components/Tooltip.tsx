import React from 'react';

type TooltipProps = {
  text: string,
  show: boolean,
  children: React.ReactNode,
};

export default function Tooltip({ text, show, children }: TooltipProps): JSX.Element {
  if (show) {
    return (
      <div className="group flex relative">
        {children}
        <span className="opacity-0 absolute rounded-md bg-black text-center z-50 -translate-x-1/2 w-full left-1/2 mt-2 top-full text-sm p-2 transition-opacity group-hover:opacity-40">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div>
      {children}
    </div>
  );
}
