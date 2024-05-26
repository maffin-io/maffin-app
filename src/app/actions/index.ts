import getTodayPrices from './getTodayPrices';

export class Actions {
  static _accessToken: string;

  static get accessToken() {
    return Actions._accessToken;
  }

  static set accessToken(token: string) {
    Actions._accessToken = token;
  }
}

const wrappedGetTodayPrices = ({
  tickers,
}: {
  tickers: string[],
}): ReturnType<typeof getTodayPrices> => (
  getTodayPrices({
    accessToken: Actions.accessToken,
    tickers,
  })
);
export { wrappedGetTodayPrices as getTodayPrices };
