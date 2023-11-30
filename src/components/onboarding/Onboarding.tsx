import React from 'react';
import Joyride from 'react-joyride';
import Image from 'next/image';
import { mutate } from 'swr';

import { useMainCurrency } from '@/hooks/api';
import { Account, Commodity, Split } from '@/book/entities';
import AccountForm from '@/components/forms/account/AccountForm';
import CurrencyForm from '@/components/forms/currency/CurrencyForm';
import CustomTooltip from '@/components/onboarding/CustomTooltip';
import maffinLogo from '@/assets/images/maffin_logo_sm.png';
import { DataSourceContext } from '@/hooks';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { useTheme } from '@/hooks/state';

type OnboardingProps = {
  show?: boolean;
};

export default function Onboarding({
  show = false,
}: OnboardingProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [run] = React.useState(show);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [accounts, setAccounts] = React.useState<{ [key: string]: Account }>({});
  const { data: theme } = useTheme();

  return (
    <Joyride
      continuous
      run={run}
      stepIndex={stepIndex}
      disableOverlayClose
      disableCloseOnEsc
      steps={[
        {
          content: (
            <div>
              <span
                className="text-left leading-relaxed"
              >
                <p>
                  Welcome! I&apos;m Maffin and I will help you navigate through the first steps
                  on your journey to unify all your financial life in here.
                </p>
                <div className="flex py-3 justify-center">
                  <Image src={maffinLogo} alt="logo" height="45" />
                </div>
                <p>
                  Before everything, you need to decide which currency
                  is going to be your main one. This is the currency that will be used to show
                  reports and calculate other things like net worth.
                </p>
                <p className="badge rounded-md info mt-3 text-left">
                  The main currency cannot be changed later so make sure you
                  choose the right one for you!
                </p>
              </span>
              <div className="flex justify-center">
                <CurrencyForm
                  onSave={async (currency: Commodity) => {
                    mutate(
                      '/api/main-currency',
                      currency,
                      { revalidate: false },
                    );
                    await createInitialAccounts(setAccounts, currency);
                    save();
                    setStepIndex(stepIndex + 1);
                  }}
                />
              </div>
            </div>
          ),
          placement: 'center',
          target: '#add-account',
          disableBeacon: true,
        },
        {
          content: (
            <div className="text-left leading-relaxed">
              <p className="mb-2">
                This represents your accounts tree. You can think of accounts as different
                categories to organise your money. We have added some defaults but you can
                add as many as you need.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          ),
          target: '#accounts-table',
        },
        {
          content: (
            <div className="text-left leading-relaxed">
              <span>
                Let&apos;s add your first
                {' '}
                <span className="badge info">
                  Bank
                </span>
                {' '}
                bank account. Set the
                {' '}
                <b>opening balance</b>
                {' '}
                to be the amount of today. If you want to start tracking from a previous date,
                set it to the amount you had in the bank at that time (you can change this later).
              </span>
              <AccountForm
                onSave={(account: Account) => {
                  mutate('/api/start-date');
                  setAccounts({
                    ...accounts,
                    bank: account,
                  });
                  setStepIndex(stepIndex + 1);
                }}
                hideDefaults
                defaultValues={{
                  name: 'My bank account',
                  parent: accounts.type_asset as Account,
                  type: 'BANK',
                  fk_commodity: useMainCurrency().data as Commodity,
                  balance: 0,
                }}
              />
            </div>
          ),
          placement: 'center',
          target: '#add-account',
        },
        {
          content: (
            <div className="text-left leading-relaxed">
              <p className="mb-2">
                See that now your bank account appears in the accounts tree.
                If you added an opening balance, you will see that your
                total net worth has changed.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          ),
          target: '#accounts-table',
        },
        {
          content: (
            <div className="text-left leading-relaxed">
              <span>
                Now that you have
                {' '}
                <span className="badge info">
                  Bank
                </span>
                {' '}
                and
                {' '}
                <span className="badge danger">
                  Expense
                </span>
                {' '}
                accounts let&apos;s add the first transaction to
                record a &quot;Groceries&quot; expense.
              </span>
              <TransactionForm
                onSave={() => {
                  save();
                  setStepIndex(stepIndex + 1);
                }}
                defaultValues={{
                  date: '',
                  description: 'Grocery shopping',
                  splits: [
                    Split.create({
                      fk_account: accounts.bank as Account,
                      quantityNum: -30,
                      quantityDenom: 1,
                      valueNum: -30,
                      valueDenom: 1,
                    }),
                    Split.create({
                      fk_account: accounts.groceries as Account,
                      quantityNum: 30,
                      quantityDenom: 1,
                      valueNum: 30,
                      valueDenom: 1,
                    }),
                  ],
                  fk_currency: useMainCurrency().data as Commodity,
                }}
              />
            </div>
          ),
          placement: 'center',
          target: '#add-account',
        },
        {
          content: (
            <div className="text-left leading-relaxed">
              <p className="mb-2">
                We save the data automatically for you whenever you do changes.
              </p>
              <p className="mb-2">
                The data is uploaded to your Google Drive, under the maffin.io folder. Make
                sure you take good care of that file!
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          ),
          target: '#save-button',
        },
        {
          content: (
            <div className="text-left leading-relaxed">
              <span>
                <p>
                  Good job! From here onwards you just need to keep adding
                  transactions and accounts to reflect your financial life as you need.
                </p>
                <div className="flex py-3 justify-center">
                  <Image src={maffinLogo} alt="logo" height="45" />
                </div>
                <p className="badge rounded-md warning mt-3">
                  You own your data which means you have to be careful. Do not
                  delete the maffin.io folder from your Google drive!
                </p>
              </span>
              <div className="flex justify-center mt-5">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Agreed!
                </button>
              </div>
            </div>
          ),
          placement: 'center',
          target: '#add-account',
        },
      ]}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          arrowColor: theme === 'dark'
            ? '#3a444e'
            : '#FFF',
          overlayColor: theme === 'dark'
            ? '#9ca3af90'
            : '#4b5563',
        },
      }}
    />
  );
}

async function createInitialAccounts(setAccounts: Function, currency: Commodity) {
  const root = await Account.findOneByOrFail({
    type: 'ROOT',
  });

  const expensesAccount = await Account.create({
    name: 'Expenses',
    type: 'EXPENSE',
    description: 'Any expense such as food, clothing, taxes, etc.',
    placeholder: true,
    fk_commodity: currency,
    parent: root,
    children: [],
  }).save();
  await expensesAccount.reload();

  // Preload needed accounts for tutorial
  setAccounts({
    type_asset: await Account.create({
      name: 'Assets',
      type: 'ASSET',
      description: 'Asset accounts are used for tracking things that are of value and can be used or sold to pay debts.',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
    }).save(),
    type_expense: expensesAccount,
    groceries: await Account.create({
      name: 'Groceries',
      type: 'EXPENSE',
      placeholder: false,
      fk_commodity: currency,
      parent: expensesAccount,
    }).save(),
  });

  await Account.insert([
    Account.create({
      name: 'Liabilities',
      type: 'LIABILITY',
      description: 'Liability accounts are used for tracking debts or financial obligations.',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
    }),
    Account.create({
      name: 'Income',
      type: 'INCOME',
      description: 'Any income received from sources such as salary, interest, dividends, etc.',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
    }),
    Account.create({
      name: 'Equity',
      type: 'EQUITY',
      description: 'Equity accounts are used to store the opening balances when you create new accounts',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
    }),
  ]);

  await Account.insert([
    Account.create({
      name: `Opening balances - ${currency.mnemonic}`,
      type: 'EQUITY',
      description: `Opening balances for ${currency.mnemonic} accounts`,
      placeholder: false,
      fk_commodity: currency,
      parent: await Account.findOneByOrFail({ type: 'EQUITY' }),
    }),
    Account.create({
      name: 'Salary',
      type: 'INCOME',
      placeholder: false,
      fk_commodity: currency,
      parent: await Account.findOneByOrFail({ type: 'INCOME' }),
    }),
    Account.create({
      name: 'Electricity',
      type: 'EXPENSE',
      description: 'The spend on electricity bills',
      placeholder: false,
      fk_commodity: currency,
      parent: expensesAccount,
    }),
    Account.create({
      name: 'Water',
      type: 'EXPENSE',
      description: 'The spend on water bills',
      placeholder: false,
      fk_commodity: currency,
      parent: expensesAccount,
    }),
  ]);

  mutate('/api/accounts');
}
