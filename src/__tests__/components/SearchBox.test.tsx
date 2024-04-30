import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import SearchBox from '@/components/SearchBox';

describe('SearchBox', () => {
  it('calls debounced on change', async () => {
    const onChange = jest.fn();
    render(<SearchBox onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'text');

    await waitFor(() => expect(onChange).toBeCalledTimes(1));
    expect(onChange).toBeCalledWith('text');
  });
});
