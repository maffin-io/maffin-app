import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Selector from '@/components/selectors/Selector';

describe('Selector', () => {
  const options = [
    { label: 'label1' },
    { label: 'label2' },
  ];

  it('renders as expected', async () => {
    const { container } = render(
      <Selector
        options={options}
        labelAttribute="label"
      />,
    );

    await screen.findByLabelText('selector');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when disabled', async () => {
    const { container } = render(
      <Selector
        options={options}
        labelAttribute="label"
        disabled
      />,
    );

    await screen.findByLabelText('selector');
    expect(container).toMatchSnapshot();
  });

  it('shows default placeholder', async () => {
    render(
      <Selector
        options={options}
        labelAttribute="label"
      />,
    );

    await screen.findByText('Choose an option');
  });

  it('shows placeholder', async () => {
    render(
      <Selector
        placeholder="My placeholder"
        options={options}
        labelAttribute="label"
      />,
    );

    await screen.findByText('My placeholder');
  });

  it('sets custom id', async () => {
    render(
      <Selector
        id="testSelector"
        options={[]}
        labelAttribute="label"
      />,
    );

    screen.getByLabelText('testSelector');
  });

  it('can disable', async () => {
    render(
      <Selector
        id="testSelector"
        disabled
        options={[]}
        labelAttribute="label"
      />,
    );

    const select = screen.getByLabelText('testSelector');
    expect(select).toBeDisabled();
  });

  it('works with no options', async () => {
    render(
      <Selector
        options={[]}
        labelAttribute="label"
      />,
    );

    const select = screen.getByLabelText('selector');
    await userEvent.click(select);

    screen.getByText('No options');
  });

  it('displays options on click', async () => {
    render(
      <Selector
        options={options}
        labelAttribute="label"
      />,
    );

    const select = screen.getByLabelText('selector');
    await userEvent.click(select);

    screen.getByText('label1');
    screen.getByText('label2');
  });

  it('displays options with meta+k', async () => {
    render(
      <Selector
        options={options}
        labelAttribute="label"
      />,
    );

    const select = screen.getByLabelText('selector');
    expect(select).not.toHaveFocus();
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(select).toHaveFocus();
    // For some reason, the above is adding k to input box so we delete it
    await userEvent.type(select, '{backspace}l');

    screen.getByText('label1');
    screen.getByText('label2');
  });

  it('removes focus on ESC', async () => {
    render(
      <Selector
        options={options}
        labelAttribute="label"
      />,
    );

    const select = screen.getByLabelText('selector');
    fireEvent.focus(select);
    expect(select).toHaveFocus();
    await userEvent.keyboard('{Esc}');
    expect(select).not.toHaveFocus();
  });

  it('backspace removes selection', async () => {
    render(
      <Selector
        options={options}
        labelAttribute="label"
      />,
    );

    const select = screen.getByLabelText('selector');
    await userEvent.click(select);
    await userEvent.click(screen.getByText('label1'));

    expect(screen.queryByText('Choose account')).toBeNull();
    await userEvent.type(select, '{backspace}');

    screen.getByText('Choose an option');
  });

  it('calls custom onChange, sets selected and blurs', async () => {
    const mockOnChange = jest.fn();
    render(
      <Selector
        onChange={mockOnChange}
        options={options}
        labelAttribute="label"
      />,
    );

    const select = screen.getByLabelText('selector');
    await userEvent.click(select);
    expect(select).toHaveFocus();

    await userEvent.click(screen.getByText('label1'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'label1',
    });
    // This actually passes regardless of blur function being there or not.
    // Need to find a way to retrieve the control element as it's the one
    // affected
    expect(select).not.toHaveFocus();
  });
});
