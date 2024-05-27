'use server';

import {
  Configuration,
  PlaidApi,
  Products,
  PlaidEnvironments,
  CountryCode,
} from 'plaid';
import { getRoles, verify } from '@/lib/jwt';

const client = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': '6625de1ca0f038001c8a2e04',
      'PLAID-SECRET': process.env.PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
}));

/**
 * https://plaid.com/docs/api/tokens/#linktokencreate
 */
export async function createLinkToken({
  userId,
  accessToken,
}: {
  userId: string,
  accessToken: string,
}): Promise<string> {
  await verify(accessToken);
  if (!(await getRoles(accessToken)).isBeta) {
    return '';
  }

  const response = await client.linkTokenCreate({
    user: {
      client_user_id: userId,
    },
    client_name: 'Maffin',
    products: [Products.Transactions],
    country_codes: Object.values(CountryCode),
    language: 'en',
  });

  return response.data.link_token;
}

/**
 * https://plaid.com/docs/api/tokens/#itempublic_tokenexchange
 */
export async function createAccessToken(publicToken: string) {
  const response = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });

  return response.data.access_token;
}

/**
 * https://plaid.com/docs/api/products/transactions/#transactionssync
 */
export async function getTransactions(accessToken: string) {
  const response = await client.transactionsSync({
    access_token: accessToken,
  });

  return response.data;
}
