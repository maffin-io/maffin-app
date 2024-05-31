import { DateTime } from 'luxon';
import { AccountType } from 'plaid';
import type { TransactionsSyncResponse } from 'plaid';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import { toAmountWithScale } from '@/helpers/number';
import { getMainCurrency } from '@/lib/queries';

/**
 * Transform the response returned from transactionsSync to our entities.
 *  - If the currency exists we re-used, if not we create a new one.
 *  - If the account is a depository, the type is BANK. If credit 'CREDIT' and if
 *    loan then 'LIABILITY'. I'm aware there are more types, we can add them
 *    whenever is needed
 */
export async function createEntitiesFromData(data: TransactionsSyncResponse) {
  const { accounts: plaidAccounts, added } = data;
  console.log(data);

  await Promise.all(
    plaidAccounts.map(async (account) => {
      let type = 'BANK';
      let parent = await Account.findOneByOrFail({
        type: 'ASSET',
        parent: {
          type: 'ROOT',
        },
      });
      if ([AccountType.Credit, AccountType.Loan].includes(account.type)) {
        type = account.type === AccountType.Credit ? 'CREDIT' : 'LIABILITY';
        parent = await Account.findOneByOrFail({
          type: 'LIABILITY',
          parent: {
            type: 'ROOT',
          },
        });
      }

      const currency = await getOrCreateCurrency(account.balances.iso_currency_code as string);
      const a = await Account.create({
        guid: `plaid-${account.persistent_account_id}`,
        name: account.name,
        fk_commodity: currency,
        type,
        description: 'Synced account',
        parent,
      }).save();

      await createTransactions({
        account: a,
        txs: added,
        currency,
      });
    }),
  );
}

async function getOrCreateCurrency(mnemonic: string): Promise<Commodity> {
  let currency = await Commodity.findOneBy({
    namespace: 'CURRENCY',
    mnemonic,
  });

  if (!currency) {
    currency = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic,
    }).save();
  }

  return currency;
}

async function createTransactions({
  account,
  txs,
  currency,
}: {
  account: Account,
  txs: TransactionsSyncResponse['added'],
  currency: Commodity,
}) {
  const [income, expense] = await getOrCreateImportAccounts();
  const transactions = txs
    .filter(tx => tx.account_id === account.guid)
    .map(tx => {
      console.log(tx);
      const { amount, scale } = toAmountWithScale(tx.amount);
      return Transaction.create({
        guid: tx.transaction_id,
        description: tx.name,
        date: DateTime.fromISO(tx.date),
        fk_currency: currency,
        splits: [
          Split.create({
            fk_account: account,
            quantityNum: -1 * amount,
            quantityDenom: parseInt('1'.padEnd(scale + 1, '0'), 10),
            valueNum: -1 * amount,
            valueDenom: parseInt('1'.padEnd(scale + 1, '0'), 10),
          }),
          Split.create({
            fk_account: amount < 0 ? income : expense,
            quantityNum: -1 * amount,
            quantityDenom: parseInt('1'.padEnd(scale + 1, '0'), 10),
            valueNum: -1 * amount,
            valueDenom: parseInt('1'.padEnd(scale + 1, '0'), 10),
          }),
        ],
      });
    });

  await Transaction.insert(transactions);
  console.log(transactions);

  currency.queryClient?.refetchQueries({
    queryKey: ['api'],
    type: 'all',
  });
}

async function getOrCreateImportAccounts(): Promise<[Account, Account]> {
  const mainCurrency = await getMainCurrency();
  const parentExpense = await Account.findOneByOrFail({
    type: 'EXPENSE',
    parent: {
      type: 'ROOT',
    },
  });

  let expenseAccount = await Account.findOneBy({
    type: 'EXPENSE',
    name: 'Imported',
    parent: {
      guid: parentExpense.guid,
    },
  });

  if (!expenseAccount) {
    expenseAccount = await Account.create({
      type: 'EXPENSE',
      name: 'Imported',
      description: 'Imported transactions that need to be reviewed',
      fk_commodity: mainCurrency,
      parent: parentExpense,
    }).save();
  }

  const parentIncome = await Account.findOneByOrFail({
    type: 'INCOME',
    parent: {
      type: 'ROOT',
    },
  });
  let incomeAccount = await Account.findOneBy({
    type: 'INCOME',
    name: 'Imported',
    parent: {
      guid: parentIncome.guid,
    },
  });

  if (!incomeAccount) {
    incomeAccount = await Account.create({
      type: 'INCOME',
      name: 'Imported',
      description: 'Imported transactions that need to be reviewed',
      fk_commodity: mainCurrency,
      parent: parentIncome,
    }).save();
  }

  return [incomeAccount, expenseAccount];
}
