const { getNext12AM } = require('./helpers');

describe('getNext12AM', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    [new Date(Date.UTC(2022, 0, 31, 23, 59)), new Date(Date.UTC(2022, 1, 1, 0, 30))],
    [new Date(Date.UTC(2022, 1, 1, 0, 0)), new Date(Date.UTC(2022, 1, 2, 0, 30))],
    [new Date(Date.UTC(2022, 0, 20, 23, 59)), new Date(Date.UTC(2022, 0, 21, 0, 30))],
    [new Date(Date.UTC(2022, 0, 20, 0, 0)), new Date(Date.UTC(2022, 0, 21, 0, 30))],
    [new Date(Date.UTC(2022, 0, 20, 0, 1)), new Date(Date.UTC(2022, 0, 21, 0, 30))],
    [new Date(Date.UTC(2022, 0, 20, 8, 0)), new Date(Date.UTC(2022, 0, 21, 0, 30))],
  ])('returns 12AM of next day', (date, expected) => {
    const spy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => date);

    expect(getNext12AM()).toEqual(expected);
  });
});
