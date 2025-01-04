import React from 'react';

export const metadata = {
  title: 'Commodities',
};

export default function CommoditiesLayout({
  children,
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <div>
      {children}
    </div>
  );
}
