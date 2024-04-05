'use client';

import React from 'react';
import {
  BiPlusCircle,
} from 'react-icons/bi';

import { useCommodities } from '@/hooks/api';
import Loading from '@/components/Loading';
import FormButton from '@/components/buttons/FormButton';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import { insertTodayPrices } from '@/lib/Stocker';
import CommodityCard from '@/components/CommodityCard';

export default function CommoditiesPage(): JSX.Element {
  const { data: commodities = [], isLoading } = useCommodities();

  if (isLoading) {
    return (
      <div className="h-screen">
        <div className="flex text-sm h-3/4 place-content-center place-items-center">
          <Loading />
        </div>
      </div>
    );
  }

  const currencies = commodities.filter(c => c.namespace === 'CURRENCY');
  const financial = commodities.filter(c => ['STOCK', 'FUND'].includes(c.namespace));
  const other = commodities.filter(c => c.namespace === 'OTHER');

  return (
    <>
      <div className="header">
        <span className="title">
          Commodities
        </span>
        <div className="ml-auto mr-3">
          <FormButton
            id="add-commodity"
            modalTitle="Add commodity"
            buttonContent={(
              <>
                <BiPlusCircle className="mr-1" />
                New
              </>
            )}
          >
            <CommodityForm onSave={() => insertTodayPrices()} />
          </FormButton>
        </div>
      </div>
      <div className="header">
        <span className="title text-lg">
          Currencies
        </span>
      </div>
      <div className="grid grid-cols-12">
        {currencies.map(commodity => <CommodityCard key={commodity.guid} guid={commodity.guid} />)}
      </div>
      {
        financial.length > 0
        && (
          <>
            <div className="header">
              <span className="title text-lg">
                Financial
              </span>
            </div>
            <div className="grid grid-cols-12">
              {financial.map(
                commodity => <CommodityCard key={commodity.guid} guid={commodity.guid} />,
              )}
            </div>
          </>
        )
      }
      {
        other.length > 0
        && (
          <>
            <div className="header">
              <span className="title text-lg">
                Other
              </span>
            </div>
            <div className="grid grid-cols-12">
              {other.map(commodity => <CommodityCard key={commodity.guid} guid={commodity.guid} />)}
            </div>
          </>
        )
      }
    </>
  );
}
