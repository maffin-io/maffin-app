import React from 'react';
import {
  ColumnDef,
  CellContext,
  PaginationState,
} from '@tanstack/react-table';
import classNames from 'classnames';
import Link from 'next/link';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { BiEdit, BiXCircle } from 'react-icons/bi';
import { Tooltip } from 'react-tooltip';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import FormButton from '@/components/buttons/FormButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import Table from '@/components/Table';
import Money from '@/book/Money';
import {
  Account,
  Split,
  Transaction,
} from '@/book/entities';
import { useSplitsCount, useSplitsPagination } from '@/hooks/api';
import type { Commodity } from '@/book/entities';
import { accountColorCode } from '@/helpers/classNames';
import fetcher from '@/hooks/api/fetcher';

export type TransactionsTableProps = {
  account: Account,
};

export default function TransactionsTable({
  account,
}: TransactionsTableProps): JSX.Element {
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { data: splitsCount } = useSplitsCount(account.guid);
  const { data: splits } = useSplitsPagination(account.guid, { pageIndex, pageSize });

  columns[3].cell = AmountPartial(account);
  columns[4].cell = TotalPartial(account);

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  return (
    <Table<Split>
      id="transactions-table"
      columns={columns}
      data={splits || []}
      showPagination
      onPaginationChange={setPagination}
      pageCount={Math.ceil((splitsCount || 0) / pageSize)}
      state={{
        pagination,
      }}
      manualPagination
    />
  );
}

const columns: ColumnDef<Split>[] = [
  {
    header: 'Date',
    id: 'date',
    enableSorting: false,
    accessorFn: (row: Split) => row.transaction.date.toMillis(),
    cell: ({ row }) => (
      <>
        <span
          data-tooltip-id={row.original.txId}
          data-tooltip-content={row.original.txId}
        >
          {row.original.transaction.date.toISODate()}
        </span>
        <Tooltip clickable className="tooltip" id={row.original.txId} />
      </>
    ),
  },
  {
    header: 'Description',
    enableSorting: false,
    cell: DescriptionCell,
  },
  {
    header: 'From/To',
    enableSorting: false,
    cell: FromToAccountCell,
  },
  {
    accessorKey: 'value',
    header: 'Amount',
    enableSorting: false,
  },
  {
    header: 'Total',
    enableSorting: false,
  },
  {
    header: 'Actions',
    enableSorting: false,
    cell: ActionsCell,
  },
];

function useTransaction(guid: string): UseQueryResult<Transaction> {
  const queryKey = [...Transaction.CACHE_KEY, guid];
  return useQuery({
    queryKey,
    queryFn: fetcher(
      () => Transaction.findOne({
        where: { guid },
        relations: {
          splits: {
            fk_account: true,
          },
        },
      }),
      queryKey,
    ),
  });
}

function DescriptionCell({ row }: CellContext<Split, unknown>): JSX.Element {
  const { data: tx } = useTransaction(row.original.txId);
  return (
    <span>
      {tx?.description}
    </span>
  );
}

function FromToAccountCell({ row }: CellContext<Split, unknown>): JSX.Element {
  const { data: tx } = useTransaction(row.original.txId);

  const otherSplits = tx?.splits.filter(
    split => split.accountId !== row.original.accountId,
  ) || [];

  return (
    <ul>
      { otherSplits.map(split => {
        const { account } = split;

        return (
          <li key={split.guid}>
            <Link
              href={`/dashboard/accounts/${split.accountId}`}
              className={accountColorCode(account, 'badge mb-0.5 hover:text-slate-300')}
            >
              { account?.path }
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function AmountPartial(
  account: Account,
) {
  return function AmountCell({ row }: CellContext<Split, unknown>): JSX.Element {
    let value = new Money(row.original.quantity, account.commodity.mnemonic || '');

    if (account?.type === 'INCOME') {
      value = value.multiply(-1);
    }
    return (
      <span
        className={
          classNames({
            'amount-positive': value.toNumber() > 0,
            'amount-negative': value.toNumber() < 0,
          }, 'flex items-center')
        }
      >
        {value.toNumber() > 0 && <FaArrowUp className="text-xs mr-1" />}
        {value.toNumber() < 0 && <FaArrowDown className="text-xs mr-1" />}
        {value.format()}
      </span>
    );
  };
}

function TotalPartial(
  account: Account,
) {
  return function TotalCell({ row }: CellContext<Split, unknown>): JSX.Element {
    return (
      <span>
        {new Money(row.original.balance, account.commodity.mnemonic).format()}
      </span>
    );
  };
}

function ActionsCell({ row }: CellContext<Split, unknown>): JSX.Element {
  const { data: tx } = useTransaction(row.original.txId);

  if (!tx || tx.guid !== row.original.txId) {
    return <span />;
  }

  const originalSplit = tx.splits.find(split => split.guid === row.original.guid) as Split;
  const defaultValues = {
    ...tx,
    date: tx.date.toISODate() as string,
    fk_currency: tx.fk_currency as Commodity,
    // This is hacky but if we pass the Split
    // class to the form, then we have reference errors as when
    // we update the form, it also updates the defaultValues
    // which means formState.isDirty is not triggered properly
    splits: [
      {
        ...originalSplit,
        value: originalSplit.value,
        quantity: originalSplit.quantity,
      },
      ...tx.splits.filter(split => split.guid !== originalSplit.guid).map(split => ({
        ...split,
        value: split.value,
        quantity: split.quantity,
      } as Split)),
    ] as Split[],
  };
  return (
    <>
      <FormButton
        id="edit-tx"
        modalTitle="Edit transaction"
        buttonContent={<BiEdit className="flex" />}
        className="link"
      >
        <TransactionForm
          action="update"
          defaultValues={defaultValues}
        />
      </FormButton>
      <FormButton
        id="delete-tx"
        modalTitle="Confirm you want to remove this transaction"
        buttonContent={<BiXCircle className="flex" />}
        className="link"
      >
        <TransactionForm
          action="delete"
          defaultValues={defaultValues}
        />
      </FormButton>
    </>
  );
}
