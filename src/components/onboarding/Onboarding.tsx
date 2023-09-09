import { useAccount, useMainCurrency } from '@/hooks/api';
import React from 'react';
import Joyride, {
  CallBackProps,
  EVENTS,
  ACTIONS,
  STATUS,
} from 'react-joyride';
import Image from 'next/image';
import { mutate } from 'swr';

import { Account, Commodity } from '@/book/entities';
import AccountForm from '@/components/forms/account/AccountForm';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import CustomTooltip from '@/components/onboarding/CustomTooltip';
import maffinLogo from '@/assets/images/maffin_logo_sm.png';

export default function Onboarding(): JSX.Element {
  const [run, setRun] = React.useState(true);
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
                  reports and calculate totals like net worth.
                </p>
                <p className="badge info mt-3 text-left">
                  The main currency cannot be changed later so choose wisely!
                </p>
              </span>
              <CommodityForm
                onSave={() => setStepIndex(1)}
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
                Let&apos;s add your first bank account. Set the
                {' '}
                <b>opening balance</b>
                {' '}
                to be the amount of today. If you want to start tracking from a previous date,
                set it to the amount you had in the bank at that time (you can change this later).
              </span>
              <AccountForm
                onSave={() => {
                  setStepIndex(2)
                }}
                defaultValues={{
                  name: 'My bank account',
                  parent: useAccount('Assets').data,
                  type: 'BANK',
                  fk_commodity: useMainCurrency().data,
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
                If you added opening balance for your bank account, you can see that now
                your &quot;Asset&quot; category is equal to the opening balance.
              </p>
              <p>
                This is because
                your bank account is within your &quot;Assets&quot; and here we display the total
                of your assets.
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

  await Account.insert([
    Account.create({
      name: 'Assets',
      type: 'ASSET',
      description: 'Asset accounts are used for tracking things that are of value and can be used or sold to pay debts.',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
    }),
    Account.create({
      name: 'Liabilities',
      type: 'LIABILITY',
      description: 'Liability accounts are used for tracking debts or financial obligations.',
      placeholder: true,
      fk_commodity: mainCommodity,
      parent: root,
    }),
    Account.create({
      name: 'Expenses',
      type: 'EXPENSE',
      description: 'Any expense such as food, clothing, taxes, etc.',
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
  mutate('/api/accounts/Assets');
}
