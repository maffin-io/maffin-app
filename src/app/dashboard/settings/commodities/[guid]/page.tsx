'use client';

import React from 'react';
import useSWRImmutable from 'swr/immutable';

import { Commodity } from '@/book/entities';

export type CommodityPageProps = {
  params: {
    guid: string,
  },
};

export default function CommodityPage({ params }: CommodityPageProps): JSX.Element {
  const { data: commodity } = useSWRImmutable(
    `/api/commodities/${params.guid}`,
    async () => Commodity.findOneByOrFail({ guid: params.guid }),
  );
  return (
    <>
      <div className="header">
        <span className="title">
          {commodity?.mnemonic}
        </span>
      </div>
      <div />
    </>
  );
}
