import React from 'react';
import { render } from '@testing-library/react';

import LeftSidebar from '@/layout/LeftSidebar';

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
