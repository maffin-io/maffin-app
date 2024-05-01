import React from 'react';
import Joyride from 'react-joyride';
import Image from 'next/image';

import { useAccounts, useMainCurrency } from '@/hooks/api';
import { Account, Commodity, Split } from '@/book/entities';
import AccountForm from '@/components/forms/account/AccountForm';
import CurrencyForm from '@/components/forms/currency/CurrencyForm';
import CustomTooltip from '@/components/onboarding/CustomTooltip';
import maffinLogo from '@/assets/images/maffin_logo_sm.png';
import { DataSourceContext } from '@/hooks';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { useTheme } from '@/hooks/state';
import ImportButton from '@/components/buttons/ImportButton';
import Link from 'next/link';

type OnboardingProps = {
  show?: boolean;
};

export default function Onboarding({
  show = false,
}: OnboardingProps): JSX.Element {
  const { save, datasource } = React.useContext(DataSourceContext);
  const [run, setRun] = React.useState(show);
  const [stepIndex, setStepIndex] = React.useState(0);
  const { data: accounts } = useAccounts();
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
                  Welcome! I&apos;m
                  {' '}
                  <span
                    className="bg-clip-text font-extrabold text-transparent bg-gradient-to-r from-green-600/70 to-cyan-600/70"
                  >
                    Maffin
                  </span>
                  {' '}
                  and I will help you navigate through the first steps
                  on your journey to unify all your financial life in here.
                </p>
                <div className="flex py-3 pb-5 justify-center">
                  <Image src={maffinLogo} alt="logo" height="65" />
                </div>
                <div>
                  Or you can just import a data file you may have exported before
                </div>
              </span>
              <div className="flex justify-center gap-3 mt-6">
                <button
                  type="button"
                  className="btn btn-cta"
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Show me!
                </button>
                <ImportButton
                  onImport={() => setRun(false)}
                  className="btn btn-primary"
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
            <div>
              <span
                className="text-left leading-relaxed"
              >
                <p>
                  Before anything, you need to decide which currency
                  is going to be your main one. This is the currency that will be used to show
                  reports and calculate other things like net worth.
                </p>
                <p className="badge info rounded-md mt-3 text-left">
                  The main currency cannot be changed later so make sure you
                  choose the right one for you!
                </p>
              </span>
              <div className="flex justify-center">
                <CurrencyForm
                  onSave={async (currency: Commodity) => {
                    datasource?.options.extra?.queryClient.setQueryData(
                      [...Commodity.CACHE_KEY, { guid: 'main' }],
                      currency,
                    );
                    await createInitialAccounts(currency);
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
              <p className="mb-2">
                After this onboarding, you can add more accounts by clicking here.
                Each user will end up with their own custom accounts tree but if you want some
                examples
                {' '}
                <Link
                  href="https://demo.maffin.io"
                >
                  check our demo
                </Link>
                .
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
          target: '#add-account',
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
                onSave={() => {
                  setStepIndex(stepIndex + 1);
                }}
                hideDefaults
                defaultValues={{
                  name: 'My bank',
                  parent: accounts?.find(a => a.type === 'ASSET') as Account,
                  type: 'BANK',
                  fk_commodity: useMainCurrency().data as Commodity,
                  placeholder: false,
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
                Your bank account is now part of the accounts tree.
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
              <p>
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
              </p>
              <p className="mt-3">
                Later you can add more transactions by going into any account page and clicking the
                &quot;Add transaction&quot; button.
              </p>
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
                      fk_account: accounts?.find(a => a.type === 'BANK') as Account,
                      quantityNum: -30,
                      quantityDenom: 1,
                      valueNum: -30,
                      valueDenom: 1,
                    }),
                    Split.create({
                      fk_account: accounts?.find(a => a.name === 'Groceries') as Account,
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
                For paid users, the data is saved automatically in your
                Google Drive whenever you do changes.
              </p>
              <p className="mb-2">
                For non paid users, data will have to be exported and imported every time
                you enter.
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
                <p>
                  Check out
                  {' '}
                  <Link href="http://docs.maffin.io" target="_blank">
                    our docs
                  </Link>
                  {' '}
                  for more information!
                </p>
                <div className="flex py-3 justify-center">
                  <Image src={maffinLogo} alt="logo" height="65" />
                </div>
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

async function createInitialAccounts(currency: Commodity) {
  const root = await Account.findOneByOrFail({
    type: 'ROOT',
  });

  const [, , incomeAccount, expensesAccount, equityAccount] = await Promise.all([
    Account.create({
      name: 'Assets',
      type: 'ASSET',
      description: 'Asset accounts are used for tracking things that are of value and can be used or sold to pay debts.',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
    }).save(),
    Account.create({
      name: 'Liabilities',
      type: 'LIABILITY',
      description: 'Liability accounts are used for tracking debts or financial obligations.',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
    }).save(),
    Account.create({
      name: 'Income',
      type: 'INCOME',
      description: 'Any income received from sources such as salary, interest, dividends, etc.',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
    }).save(),
    await Account.create({
      name: 'Expenses',
      type: 'EXPENSE',
      description: 'Any expense such as food, clothing, taxes, etc.',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
      children: [],
    }).save(),
    Account.create({
      name: 'Equity',
      type: 'EQUITY',
      description: 'Equity accounts are used to store the opening balances when you create new accounts',
      placeholder: true,
      fk_commodity: currency,
      parent: root,
      hidden: true,
    }).save(),
  ]);

  await Promise.all([
    Account.create({
      name: `Opening balances - ${currency.mnemonic}`,
      type: 'EQUITY',
      description: `Opening balances for ${currency.mnemonic} accounts`,
      placeholder: false,
      fk_commodity: currency,
      parent: equityAccount,
    }).save(),
    Account.create({
      name: 'Salary',
      type: 'INCOME',
      placeholder: false,
      fk_commodity: currency,
      parent: incomeAccount,
    }).save(),
    Account.create({
      name: 'Groceries',
      type: 'EXPENSE',
      placeholder: false,
      fk_commodity: currency,
      parent: expensesAccount,
    }).save(),
    Account.create({
      name: 'Electricity',
      type: 'EXPENSE',
      description: 'The spend on electricity bills',
      placeholder: false,
      fk_commodity: currency,
      parent: expensesAccount,
    }).save(),
    Account.create({
      name: 'Water',
      type: 'EXPENSE',
      description: 'The spend on water bills',
      placeholder: false,
      fk_commodity: currency,
      parent: expensesAccount,
    }).save(),
  ]);
}
