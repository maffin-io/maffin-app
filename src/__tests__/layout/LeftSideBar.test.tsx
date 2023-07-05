import React from 'react';
import { render } from '@testing-library/react';
import type { LinkProps } from 'next/link';

import LeftSidebar from '@/layout/LeftSidebar';

jest.mock('next/link', () => jest.fn(
  (
    props: LinkProps & { children?: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>,
  ) => (
    <a className={props.className} href={props.href.toString()}>{props.children}</a>
  ),
));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const usePathname = jest.spyOn(require('next/navigation'), 'usePathname');

describe('LeftSidebar', () => {
  it('renders as expected', () => {
    usePathname.mockReturnValue('/dashboard/accounts');
    const { container } = render(<LeftSidebar />);

    expect(container).toMatchSnapshot();
  });
});
