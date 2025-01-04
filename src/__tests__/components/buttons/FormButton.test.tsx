import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import { BiPlusCircle } from 'react-icons/bi';

import FormButton from '@/components/buttons/FormButton';
import { DataSourceContext } from '@/hooks';
import Modal from '@/components/ui/Modal';
import type { DataSourceContextType } from '@/hooks';

jest.mock('@/components/ui/Modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));

describe('FormButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', async () => {
    const mockSave = jest.fn(() => Promise.resolve());
    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <FormButton
          modalTitle="Add"
          buttonContent={(
            <>
              <BiPlusCircle className="mr-1" />
              New
            </>
          )}
        >
          <TestComponent />
        </FormButton>
      </DataSourceContext.Provider>,
    );

    fireEvent.click(screen.getByText('submit form'));
    expect(mockSave).toHaveBeenCalledTimes(1);

    expect(Modal).toHaveBeenCalledWith(
      {
        showClose: true,
        className: 'modal card',
        triggerProps: { className: 'btn btn-primary' },
        triggerContent: expect.anything(),
        children: expect.anything(),
        ref: {
          current: null,
        },
      },
      undefined,
    );
  });
});

function TestComponent({
  onSave = () => {},
}: {
  onSave?: Function,
}): React.JSX.Element {
  return <button onClick={() => onSave()} type="button">submit form</button>;
}
