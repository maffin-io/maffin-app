import React from 'react';

export const metadata = {
  title: 'Commodities',
};

export default function CommoditiesLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <div>
      {children}
    </div>
  );
}
