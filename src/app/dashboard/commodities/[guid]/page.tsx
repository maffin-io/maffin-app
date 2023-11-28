'use client';

import React from 'react';
import { BiEdit } from 'react-icons/bi';
import useSWRImmutable from 'swr/immutable';

import { useCommodities } from '@/hooks/api';
import CommodityFormButton from '@/components/buttons/CommodityFormButton';
import PriceFormButton from '@/components/buttons/PriceFormButton';
import Loading from '@/components/Loading';
import { PricesTable, PricesChart } from '@/components/pages/commodity';
import { Price } from '@/book/entities';

export type CommodityPageProps = {
  params: {
    guid: string,
  },
};

export default function CommodityPage({ params }: CommodityPageProps): JSX.Element {
  const { data: commodities } = useCommodities();
  const { isLoading } = useCommodities();
  const { data: prices } = useSWRImmutable(
    `/api/prices/${params.guid}`,
    async () => Price.findBy({
      fk_commodity: {
        guid: params.guid,
      },
    }),
  );

  if (!commodities || isLoading) {
    return (
      <div className="h-screen">
        <div className="flex text-sm h-3/4 place-content-center place-items-center">
          <Loading />
        </div>
      </div>
    );
  }

  const commodity = commodities.find(c => c.guid === params.guid);
  if (!commodity) {
    return (
      <div className="flex h-screen text-sm place-content-center place-items-center">
        {`Commodity ${params.guid} does not exist`}
      </div>
    );
  }

  const byCurrency: { [guid: string]: Price[] } = {};
  if (prices) {
    prices.forEach(price => {
      if (!(price.currency.guid in byCurrency)) {
        byCurrency[price.currency.guid] = [];
      }
      byCurrency[price.currency.guid].push(price);
    });
  }
  const commodityCurrency = commodity.namespace !== 'CURRENCY' ? prices?.[0].fk_currency || undefined : undefined;

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
            <PriceFormButton
              defaultValues={{
                fk_commodity: commodity,
                fk_currency: commodityCurrency,
              }}
            />
            <CommodityFormButton
              defaultValues={{
                ...commodity,
              }}
              action="update"
            >
              <BiEdit />
            </CommodityFormButton>
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
                    {`${commodity.mnemonic} - ${byCurrencyPrices[0].currency.mnemonic} price data`}
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
