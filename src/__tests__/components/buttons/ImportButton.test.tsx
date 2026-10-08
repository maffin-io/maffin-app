import React from 'react';
import {
  render,
} from '@testing-library/react';

import ImportButton from '@/components/buttons/ImportButton';
import Modal from '@/components/ui/Modal';

jest.mock('@/components/ui/Modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/buttons/import/DBImportButton', () => jest.fn(
  () => <div data-testid="DBImportButton" />,
));

jest.mock('@/components/buttons/import/PlaidImportButton', () => jest.fn(
  () => <div data-testid="PlaidImportButton" />,
));

describe('ImportButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(<ImportButton />);

    expect(Modal).toHaveBeenCalledWith(
      {
        showClose: true,
        className: 'modal bg-background-800',
        triggerProps: { className: 'btn btn-primary' },
        triggerContent: expect.anything(),
        children: expect.anything(),
        ref: {
          current: null,
        },
      },
      undefined,
    );

    expect(container).toMatchSnapshot();
  });
});
