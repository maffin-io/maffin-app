'use client';

import React from 'react';
import { BiEdit } from 'react-icons/bi';

import { useCommodities } from '@/hooks/api';
import CommodityFormButton from '@/components/buttons/CommodityFormButton';
import Loading from '@/components/Loading';

export type CommodityPageProps = {
  params: {
    guid: string,
  },
};

export default function CommodityPage({ params }: CommodityPageProps): JSX.Element {
  const { data: commodities } = useCommodities();
  const { isLoading } = useCommodities();

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

  return (
    <>
      <div className="header">
        <span className="title">
          {commodity?.mnemonic}
        </span>
        <div className="ml-auto mr-3">
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
      <div />
    </>
  );
}
