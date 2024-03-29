'use client';

import React from 'react';
import {
  BiLineChart,
  BiMoney,
  BiSolidGhost,
  BiPlusCircle,
} from 'react-icons/bi';

import { useCommodities } from '@/hooks/api';
import Link from 'next/link';
import Loading from '@/components/Loading';
import FormButton from '@/components/buttons/FormButton';
import CommodityForm from '@/components/forms/commodity/CommodityForm';

export default function CommoditiesPage(): JSX.Element {
  let { data: commodities } = useCommodities();
  const { isLoading } = useCommodities();

  if (isLoading) {
    return (
      <div className="h-screen">
        <div className="flex text-sm h-3/4 place-content-center place-items-center">
          <Loading />
        </div>
      </div>
    );
  }

  commodities = commodities || [];

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
            <CommodityForm />
          </FormButton>
        </div>
      </div>
      <div className="header">
        <span className="title text-lg">
          Currencies
        </span>
      </div>
      <div className="grid grid-cols-12">
        {currencies.map(commodity => (
          <Link
            key={commodity.guid}
            href={`/dashboard/commodities/${commodity.guid}`}
            className="card col-span-1 cursor-pointer hover:shadow-lg text-slate-400 dark:hover:text-white"
          >
            <div className="flex items-center">
              <BiMoney className="mr-1" />
              {commodity.mnemonic}
            </div>
          </Link>
        ))}
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
              {financial.map(commodity => (
                <Link
                  key={commodity.guid}
                  href={`/dashboard/commodities/${commodity.guid}`}
                  className="card col-span-2 cursor-pointer hover:shadow-lg text-slate-400 dark:hover:text-white"
                >
                  <div className="flex items-center">
                    <BiLineChart className="mr-1" />
                    {commodity.mnemonic}
                  </div>
                </Link>
              ))}
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
              {other.map(commodity => (
                <Link
                  key={commodity.guid}
                  href={`/dashboard/commodities/${commodity.guid}`}
                  className="card col-span-2 cursor-pointer hover:shadow-lg text-slate-400 dark:hover:text-white"
                >
                  <div className="flex items-center">
                    <BiSolidGhost className="mr-1" />
                    {commodity.mnemonic}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )
      }
    </>
  );
}
