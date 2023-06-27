import React from 'react';
import { render, screen } from '@testing-library/react';

import DashboardLayout from '@/app/dashboard/layout';
import * as userHooks from '@/hooks/useUser';

jest.mock('@/hooks/useUser', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useUser'),
}));

jest.mock('@/layout/LeftSidebar', () => {
  function LeftSidebar() {
    return (
      <div className="LeftSidebar" />
    );
  }

  return LeftSidebar;
});

jest.mock('@/layout/Footer', () => {
  function Footer() {
    return (
      <div className="Footer" />
    );
  }

  return Footer;
});

jest.mock('@/layout/Topbar', () => {
  function Topbar() {
    return (
      <div className="Topbar" />
    );
  }

  return Topbar;
});

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.spyOn(userHooks, 'default').mockReturnValue({ user: undefined });
  });

  it('returns loading when no user available', async () => {
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    const child = screen.queryByTestId('child');
    expect(child).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('returns loading when user available but not logged in', async () => {
    jest.spyOn(userHooks, 'default').mockReturnValue({
      user: {
        name: '',
        email: '',
        image: '',
        isLoggedIn: false,
      },
    });
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    const child = screen.queryByTestId('child');
    expect(child).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when user available', async () => {
    jest.spyOn(userHooks, 'default').mockReturnValue({
      user: {
        name: 'name',
        email: 'email',
        image: 'image',
        isLoggedIn: true,
      },
    });

    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    const child = await screen.findByTestId('child');
    expect(child).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
