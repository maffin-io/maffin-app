import React from 'react';
import Link from 'next/link';
import {
  BiLineChart,
  BiMoney,
  BiSolidGhost,
} from 'react-icons/bi';

import { Tooltip, UpgradeTooltip } from '@/components/tooltips';
import { useCommodity, useMainCurrency, usePrices } from '@/hooks/api';
import Loading from '@/components/Loading';
import { IS_PAID_PLAN } from '@/helpers/env';

export type CommodityCardProps = {
  guid: string;
};

export default function CommodityCard({
  guid,
}: CommodityCardProps): JSX.Element {
  const { data: commodity } = useCommodity(guid);
  const { data: mainCurrency } = useMainCurrency();
  const { data: prices } = usePrices({ from: commodity });

  if (!commodity || !prices) {
    return <Loading />;
  }

  let iconComponent = <BiLineChart className="mr-1" />;
  let tooltipContent = (
    <div>
      <p>
        No prices found for this commodity! This means that accounts
        using this commodity don&apos;t have an exchange rate to convert
        to your main currency and we will convert 1 to 1 for now.
      </p>

      <p className="mt-1">
        To fix this, make sure the symbol can be found in

        {' '}
        <Link
          href={`https://finance.yahoo.com/quote/${commodity.mnemonic}`}
          target="blank"
        >
          Yahoo
        </Link>
        . If not, consider adding this commodity
        as &quot;OTHER&quot; type instead and add prices manually.
      </p>
    </div>
  );

  if (commodity.namespace === 'CURRENCY') {
    iconComponent = <BiMoney className="mr-1" />;
    tooltipContent = (
      <div>
        <p>
          No prices found for the
          {' '}
          {`${commodity.mnemonic}.${mainCurrency?.mnemonic}`}
          {' '}
          pair! This means that accounts using this currency don&apos;
          have an exchange rate to convert to your main currency and we
          will convert 1 to 1 for now.
        </p>

        <p className="mt-1">
          To fix this, make sure the currency can be found in
          {' '}
          <Link
            href={`https://finance.yahoo.com/quote/${commodity.mnemonic}${mainCurrency?.mnemonic}=X`}
            target="blank"
          >
            Yahoo
          </Link>
          . If it does not exist, it means you will have to track prices for this currency
          manually.
        </p>
      </div>
    );
  } else if (commodity.namespace === 'OTHER') {
    tooltipContent = (
      <div>
        <p>
          No prices found for this commodity! This means that accounts
          using this commodity don&apos;t have an exchange rate to convert
          to your main currency and we will convert 1 to 1 for now.
        </p>

        <p className="mt-1">
          To fix this, make sure to add prices manually for this commodity
        </p>
      </div>
    );
    iconComponent = <BiSolidGhost className="mr-1" />;
  }

  let priceAvailable = false;
  if (commodity.namespace === 'CURRENCY') {
    const price = prices.getPrice(commodity.mnemonic, mainCurrency?.mnemonic || '');
    priceAvailable = price?.guid !== 'missing_price';
  } else {
    const price = prices.getInvestmentPrice(commodity.mnemonic);
    priceAvailable = price?.guid !== 'missing_price';
  }

  return (
    <>
      <Link
        key={commodity.guid}
        href={`/dashboard/commodities/${commodity.guid}`}
        className="card col-span-2 cursor-pointer hover:shadow-lg text-slate-400 dark:hover:text-white"
      >
        <div className="flex items-center">
          {iconComponent}
          {commodity.mnemonic}
          {
            !priceAvailable
            && (
              <div
                className="badge warning ml-auto"
                data-tooltip-id={`missing-price-${guid}`}
              >
                !
              </div>
            )
          }
        </div>
      </Link>

      {
        !priceAvailable
        && (
          IS_PAID_PLAN
            ? (
              <Tooltip
                id={`missing-price-${guid}`}
                className="!w-1/6 !text-xs"
                clickable
              >
                {tooltipContent}
              </Tooltip>
            )
            : (
              <UpgradeTooltip
                id={`missing-price-${guid}`}
                message="Non paid users need to add prices manually. Consider upgrading for getting a bunch of commodities synced automatically for you!"
              />
            )
        )
      }
    </>
  );
}
