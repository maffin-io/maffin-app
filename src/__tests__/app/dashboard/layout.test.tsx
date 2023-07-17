import React from 'react';
import { render, screen } from '@testing-library/react';
import type { DataSource } from 'typeorm';

import DashboardLayout from '@/app/dashboard/layout';
import * as userHooks from '@/hooks/useUser';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/hooks/useUser', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useUser'),
}));

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
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
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
  });

  it('returns loading when no user available', async () => {
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
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

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('returns loading when datasource not available', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([null]);
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

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when user and datasource available', async () => {
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
