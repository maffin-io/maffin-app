import React from 'react';
import { render } from '@testing-library/react';

import Footer from '@/layout/Footer';

describe('Footer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders as expected', () => {
    const { container } = render(<Footer />);

    expect(container).toMatchSnapshot();
  });
});
