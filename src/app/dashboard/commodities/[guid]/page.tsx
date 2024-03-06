'use client';

import React from 'react';
import { BiEdit, BiPlusCircle } from 'react-icons/bi';
import Link from 'next/link';

import { useCommodity, usePrices } from '@/hooks/api';
import FormButton from '@/components/buttons/FormButton';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import PriceForm from '@/components/forms/price/PriceForm';
import Loading from '@/components/Loading';
import { PricesChart } from '@/components/pages/commodity';
import { PricesTable } from '@/components/tables';
import { Price } from '@/book/entities';

export type CommodityPageProps = {
  params: {
    guid: string,
  },
};

export default function CommodityPage({ params }: CommodityPageProps): JSX.Element {
  const { data: commodity, isLoading } = useCommodity(params.guid);
  const { data: prices } = usePrices({ from: commodity });

  if (isLoading) {
    return (
      <div className="h-screen">
        <div className="flex text-sm h-3/4 place-content-center place-items-center">
          <Loading />
        </div>
      </div>
    );
  }

  if (!commodity) {
    return (
      <div className="flex h-screen text-sm place-content-center place-items-center">
        {`Commodity ${params.guid} does not exist`}
      </div>
    );
  }

  const byCurrency: { [guid: string]: Price[] } = {};
  if (prices) {
    prices.prices.forEach(price => {
      if (!(price.currency.guid in byCurrency)) {
        byCurrency[price.currency.guid] = [];
      }
      byCurrency[price.currency.guid].push(price);
    });
  }
  const commodityCurrency = commodity.namespace !== 'CURRENCY' ? prices?.prices[0]?.fk_currency || undefined : undefined;

  return (
    <>
      <div className="header">
        <span className="title">
          {commodity?.mnemonic}
          {
            commodity?.fullname
            && ` - ${commodity.fullname}`
          }
        </span>
        <div className="ml-auto">
          <div className="flex gap-1">
            <FormButton
              id="add-price"
              modalTitle="Add price"
              buttonContent={(
                <>
                  <BiPlusCircle className="mr-1" />
                  Add price
                </>
              )}
            >
              <PriceForm
                defaultValues={{
                  fk_commodity: commodity,
                  fk_currency: commodityCurrency,
                }}
                hideDefaults
              />
            </FormButton>
            <FormButton
              id="edit-commodity"
              modalTitle={`Edit ${commodity.mnemonic}`}
              buttonContent={<BiEdit />}
            >
              <CommodityForm
                defaultValues={{
                  ...commodity,
                }}
                action="update"
              />
            </FormButton>
          </div>
        </div>
      </div>
      <div>
        {
          Object.entries(byCurrency).map(
            ([key, byCurrencyPrices]) => (
              <div key={key}>
                <div className="header">
                  <span className="title text-lg">
                    {`${commodity.mnemonic} - `}
                    <Link
                      href={`/dashboard/commodities/${byCurrencyPrices[0].currency.guid}`}
                    >
                      {byCurrencyPrices[0].currency.mnemonic}
                    </Link>
                    {' '}
                    price data
                  </span>
                </div>
                <div className="grid grid-cols-12 card">
                  <div className="col-span-7">
                    <PricesChart prices={byCurrencyPrices} />
                  </div>
                  <div className="col-span-5">
                    <PricesTable prices={byCurrencyPrices} />
                  </div>
                </div>
              </div>
            ),
          )
        }
      </div>
    </>
  );
}
