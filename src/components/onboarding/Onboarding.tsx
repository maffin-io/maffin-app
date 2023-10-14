import React from 'react';
import Joyride from 'react-joyride';
import Image from 'next/image';
import { mutate } from 'swr';

import { useMainCurrency } from '@/hooks/api';
import { Account, Commodity, Split } from '@/book/entities';
import AccountForm from '@/components/forms/account/AccountForm';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
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
                <p className="badge info mt-3 text-left">
                  The main currency cannot be changed later so make sure you
                  choose the right one for you!
                </p>
              </span>
              <CommodityForm
                onSave={async (commodity: Commodity) => {
                  mutate(
                    '/api/main-currency',
                    commodity,
                  );
                  await createInitialAccounts(setAccounts);
                  save();
                  setStepIndex(1);
                }}
              />
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
                  onClick={() => setStepIndex(2)}
                >
                  Next
                </button>
              </div>
            </div>
          ),
          target: '#save-button',
        },
        {
          spotlightClicks: true,
          content: (
            <div className="text-left leading-relaxed">
              <p className="mb-2">
                We know some people are very opinionated about dark vs light
                themes.
              </p>
              <p className="mb-2">
                In order for you not to suffer the whole tutorial with a theme you
                don&apos;t like, feel free to change it by clicking here!
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStepIndex(3)}
                >
                  Next
                </button>
              </div>
            </div>
          ),
          target: '#theme-button',
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
                  setAccounts({
                    ...accounts,
                    bank: account,
                  });
                  setStepIndex(4);
                }}
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
                This represents your accounts tree. Once you add more accounts, this
                widget becomes very useful to navigate through all your accounts.
              </p>
              <p className="mb-2">
                You can see that your bank account is now there with the opening
                balance you added and that your &quot;Assets&quot; parent account is
                displaying that amount too.
              </p>
              <p>
                This is because it accumulates the total of the sub accounts.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStepIndex(5)}
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
                Let&apos; now add an
                {' '}
                <span className="badge danger">
                  Expense
                </span>
                {' '}
                account to track your expenses, say for example
                Groceries. Note that we let you create as many accounts as you want.
                Each account is like a category and allows you to visualise and report accordingly.
                Some examples can be things like &quot;Rent&quot;, &quot;Electricity&quot;, etc.
              </span>
              <AccountForm
                onSave={(account: Account) => {
                  setAccounts({
                    ...accounts,
                    expense: account,
                  });
                  setStepIndex(6);
                }}
                defaultValues={{
                  name: 'Groceries',
                  parent: accounts.type_expense as Account,
                  type: 'EXPENSE',
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
                  setStepIndex(7);
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
                      fk_account: accounts.expense as Account,
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
              <span>
                <p>
                  Good job! From here onwards you just need to keep adding
                  transactions and accounts to reflect your financial life as you need.
                </p>
                <div className="flex py-3 justify-center">
                  <Image src={maffinLogo} alt="logo" height="45" />
                </div>
                <p className="badge warning mt-3">
                  You own your data which means you have to be careful. Do not
                  delete the maffin.io folder from your Google drive!
                </p>
              </span>
              <div className="flex justify-center mt-5">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStepIndex(8)}
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

async function createInitialAccounts(setAccounts: Function) {
  const mainCommodity = await Commodity.findOneByOrFail({ namespace: 'CURRENCY' });
  const root = await Account.findOneByOrFail({
    type: 'ROOT',
  });

  // Preload needed accounts for tutorial
  setAccounts({
    type_asset: await Account.create({
      name: 'Assets',
      type: 'ASSET',
      description: 'Asset accounts are used for tracking things that are of value and can be used or sold to pay debts.',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
    }).save(),
    type_expense: await Account.create({
      name: 'Expenses',
      type: 'EXPENSE',
      description: 'Any expense such as food, clothing, taxes, etc.',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
      children: [],
    }).save(),
  });

  const liabilitiesAccount = Account.create({
    name: 'Liabilities',
    type: 'LIABILITY',
    description: 'Liability accounts are used for tracking debts or financial obligations.',
    placeholder: true,
    fk_commodity: mainCommodity,
    parent: root,
  });

  const incomeAccount = Account.create({
    name: 'Income',
    type: 'INCOME',
    description: 'Any income received from sources such as salary, interest, dividends, etc.',
    placeholder: true,
    fk_commodity: mainCommodity,
    parent: root,
  });

  const equityAccount = Account.create({
    name: 'Equity',
    type: 'EQUITY',
    description: 'Equity accounts are used to store the opening balances when you create new accounts',
    placeholder: true,
    fk_commodity: mainCommodity,
    parent: root,
  });

  await Account.insert([liabilitiesAccount, incomeAccount, equityAccount]);

  await Account.create({
    name: `Opening balances - ${mainCommodity.mnemonic}`,
    type: 'EQUITY',
    description: `Opening balances for ${mainCommodity.mnemonic} accounts`,
    placeholder: false,
    fk_commodity: mainCommodity,
    parent: await Account.findOneByOrFail({ type: 'EQUITY' }),
  }).save();

  mutate('/api/accounts');
}
