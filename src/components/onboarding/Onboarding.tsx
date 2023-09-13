import React from 'react';
import Joyride, {
  CallBackProps,
  EVENTS,
  ACTIONS,
  STATUS,
} from 'react-joyride';
import Image from 'next/image';
import { mutate } from 'swr';

import { useAccount, useMainCurrency } from '@/hooks/api';
import { Account, Commodity, Split } from '@/book/entities';
import AccountForm from '@/components/forms/account/AccountForm';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import CustomTooltip from '@/components/onboarding/CustomTooltip';
import maffinLogo from '@/assets/images/maffin_logo_sm.png';
import TransactionForm from '../forms/transaction/TransactionForm';

type OnboardingProps = {
  show?: boolean;
};

export default function Onboarding({
  show = false,
}: OnboardingProps): JSX.Element {
  const [run, setRun] = React.useState(show);
  const [stepIndex, setStepIndex] = React.useState(0);

  async function handleJoyrideCallback(data: CallBackProps) {
    const {
      action,
      index,
      status,
      type,
    } = data;

    if (([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
    }
  }

  return (
    <Joyride
      continuous
      run={run}
      stepIndex={stepIndex}
      callback={(data) => handleJoyrideCallback(data)}
      disableOverlayClose
      disableCloseOnEsc
      steps={[
        {
          content: (
            <div>
              <span
                className="text-left"
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
                onSave={async () => {
                  await createInitialAccounts();
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
            <div>
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
                  setStepIndex(2);
                }}
                defaultValues={{
                  name: 'My bank account',
                  parent: useAccount('Assets').data as Account,
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
            <div>
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
                  className="btn-primary"
                  onClick={() => setStepIndex(3)}
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
            <div>
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
                onSave={() => {
                  setStepIndex(4);
                }}
                defaultValues={{
                  name: 'Groceries',
                  parent: useAccount('Expenses').data as Account,
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
            <div>
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
                  setStepIndex(5);
                }}
                defaultValues={{
                  date: '',
                  description: '',
                  splits: [
                    Split.create(),
                    Split.create(),
                  ],
                  fk_currency: useMainCurrency().data as Commodity,
                }}
              />
            </div>
          ),
          placement: 'center',
          target: '#add-account',
        },
      ]}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          arrowColor: '#3a444e',
          overlayColor: 'rgba(255, 255, 255, .3)',
        },
      }}
    />
  );
}

async function createInitialAccounts() {
  const mainCommodity = await Commodity.findOneByOrFail({ namespace: 'CURRENCY' });
  const root = await Account.findOneByOrFail({
    type: 'ROOT',
  });

  // We need Assets and Expenses accounts in the next steps of Onboarding so
  // updating directly to make sure they are available.
  mutate(
    '/api/account/Assets',
    await Account.create({
      name: 'Assets',
      type: 'ASSET',
      description: 'Asset accounts are used for tracking things that are of value and can be used or sold to pay debts.',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
    }).save(),
  );

  mutate(
    '/api/account/Expenses',
    await Account.create({
      name: 'Expenses',
      type: 'EXPENSE',
      description: 'Any expense such as food, clothing, taxes, etc.',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
    }).save(),
  );

  await Account.insert([
    Account.create({
      name: 'Liabilities',
      type: 'LIABILITY',
      description: 'Liability accounts are used for tracking debts or financial obligations.',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
    }),
    Account.create({
      name: 'Income',
      type: 'INCOME',
      description: 'Any income received from sources such as salary, interest, dividends, etc.',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
    }),
    Account.create({
      name: 'Equity',
      type: 'EQUITY',
      description: 'Equity accounts are used to store the opening balances when you create new accounts',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
    }),
  ]);

  const equityAccount = await Account.findOneByOrFail({ type: 'EQUITY' });

  await Account.create({
    name: `Opening balances - ${mainCommodity.mnemonic}`,
    type: 'EQUITY',
    description: `Opening balances for ${mainCommodity.mnemonic} accounts`,
    placeholder: false,
    fk_commodity: mainCommodity,
    parent: equityAccount,
  }).save();

  mutate('/api/accounts');
  // mutate('/api/monthly-totals');
}
