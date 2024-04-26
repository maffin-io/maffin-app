import { render } from '@testing-library/react';
import React from 'react';

import EditorPage from '@/app/dashboard/editor/page';

jest.mock('@/components/SQLEditor', () => jest.fn(
  () => <div data-testid="SQLEditor" />,
));

jest.mock('@/components/SQLExplorer', () => jest.fn(
  () => <div data-testid="SQLExplorer" />,
));

describe('EditorPage', () => {
  it('renders as expected', () => {
    const { container } = render(<EditorPage />);

    expect(container).toMatchSnapshot();
  });
});
