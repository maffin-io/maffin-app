import React from 'react';
import { render } from '@testing-library/react';

import Footer from '@/layout/Footer';

describe('Footer', () => {
  it('renders as expected', () => {
    const { container } = render(<Footer />);

    expect(container).toMatchSnapshot();
  });
});
