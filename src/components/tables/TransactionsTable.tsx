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
import { DateTime } from 'luxon';

import FormButton from '@/components/buttons/FormButton';
import { Tooltip } from '@/components/tooltips';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import SearchBox from '@/components/SearchBox';
import Table from '@/components/tables/Table';
import Money from '@/book/Money';
import {
  Account,
  Split,
} from '@/book/entities';
import {
  useAccounts,
  useSplitsCount,
  useSplitsPagination,
  useTransaction,
} from '@/hooks/api';
import { accountColorCode } from '@/helpers/classNames';

export type TransactionsTableProps = {
  account: Account,
};

export default function TransactionsTable({
  account,
}: TransactionsTableProps): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { data: splitsCount } = useSplitsCount(account.guid, search);
  const { data: splits } = useSplitsPagination(
    account.guid,
    { pageSize, pageIndex },
    search,
  );

  columns[3].cell = AmountPartial(account);
  columns[4].cell = BalancePartial(account);

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  return (
    <>
      <SearchBox onChange={setSearch} />
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
    </>
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
          {row.original.transaction.date.toLocaleString(DateTime.DATE_SHORT)}
        </span>
        <Tooltip clickable id={row.original.txId} />
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
    header: 'Balance',
    enableSorting: false,
  },
  {
    header: 'Actions',
    enableSorting: false,
    cell: ActionsCell,
  },
];

function DescriptionCell({ row }: CellContext<Split, unknown>): React.JSX.Element {
  const { data: tx } = useTransaction({ guid: row.original.txId });
  return (
    <span>
      {tx?.description}
    </span>
  );
}

function FromToAccountCell({ row }: CellContext<Split, unknown>): React.JSX.Element {
  const { data: tx } = useTransaction({ guid: row.original.txId });
  const { data: accounts } = useAccounts();

  const otherSplits = tx?.splits.filter(
    split => split.accountId !== row.original.accountId,
  ) || [];

  return (
    <ul>
      { otherSplits.map(split => {
        const account = accounts?.find(a => a.guid === split.accountId) as Account;

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
  return function AmountCell({ row }: CellContext<Split, unknown>): React.JSX.Element {
    let value = new Money(row.original.quantity, account.commodity.mnemonic || '');

    if (account?.type === 'INCOME') {
      value = value.multiply(-1);
    }
    return (
      <span
        className={
          classNames({
            'text-success': value.toNumber() > 0,
            'text-danger': value.toNumber() < 0,
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

function BalancePartial(
  account: Account,
) {
  return function BalanceCell({ row }: CellContext<Split, unknown>): React.JSX.Element {
    return (
      <span>
        {new Money(row.original.balance, account.commodity.mnemonic).format()}
      </span>
    );
  };
}

function ActionsCell({ row }: CellContext<Split, unknown>): React.JSX.Element {
  const { data: tx } = useTransaction({ guid: row.original.txId });

  if (!tx || tx.guid !== row.original.txId) {
    return <span />;
  }

  return (
    <>
      <FormButton
        id="edit-tx"
        modalTitle="Edit transaction"
        buttonContent={<BiEdit className="flex" />}
        className="text-left text-cyan-700 hover:text-cyan-600"
      >
        <TransactionForm
          action="update"
          guid={row.original.txId}
          onSave={() => tx.queryClient?.invalidateQueries({
            queryKey: [...Split.CACHE_KEY, row.original.accountId],
          })}
        />
      </FormButton>
      <FormButton
        id="delete-tx"
        modalTitle="Confirm you want to remove this transaction"
        buttonContent={<BiXCircle className="flex" />}
        className="text-left text-cyan-700 hover:text-cyan-600"
      >
        <TransactionForm
          action="delete"
          guid={row.original.txId}
        />
      </FormButton>
    </>
  );
}
