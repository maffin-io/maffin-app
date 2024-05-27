import getTodayPrices from './getTodayPrices';
import { createLinkToken } from './plaid';

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

const wrapperCreateLinkToken = ({
  userId,
}: {
  userId: string,
}): ReturnType<typeof createLinkToken> => (
  createLinkToken({
    accessToken: Actions.accessToken,
    userId,
  })
);
export { wrapperCreateLinkToken as createLinkToken };
export { createAccessToken, getTransactions } from './plaid';
