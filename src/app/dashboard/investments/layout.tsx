import React from 'react';

export const metadata = {
  title: 'Investments',
};

export default function InvestmentsLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <div>
      {children}
    </div>
  );
}
