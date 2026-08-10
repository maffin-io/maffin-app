import React from 'react';
import Table from '@/components/tables/Table';
import { BiSolidDownArrow, BiSolidRightArrow } from 'react-icons/bi';
import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import type { PropsWithChildren } from 'react';

import { useDataSource } from '@/hooks';
import Loading from './Loading';

export default function SQLExplorer(): React.JSX.Element {
  const { datasource } = useDataSource();

  if (!datasource) {
    return <Loading />;
  }

  const metadatas = datasource.entityMetadatas;

  return (
    <ul>
      {
        metadatas.map(metadata => (
          <li key={metadata.givenTableName}>
            <Expandable
              content={(
                <span className="text-md">
                  {metadata.givenTableName}
                </span>
              )}
            >
              <Table<ColumnMetadata>
                id={`sql-table-${metadata.givenTableName}`}
                showHeader={false}
                columns={[
                  {
                    accessorKey: 'databaseName',
                  },
                  {
                    id: 'type',
                    accessorFn: (row: ColumnMetadata) => {
                      // @ts-ignore
                      const { name } = row.type;
                      if (name) {
                        return name;
                      }

                      const { length } = row;

                      if (length) {
                        return `${row.type}(${length})`;
                      }

                      return row.type;
                    },
                  },
                ]}
                data={metadata.columns.filter(m => m.isSelect)}
              />
            </Expandable>
          </li>
        ))
      }
    </ul>
  );
}

function Expandable({
  content,
  children,
}: { content: React.JSX.Element } & PropsWithChildren): React.JSX.Element {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <>
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center cursor-pointer"
      >
        {
          expanded
            ? <BiSolidDownArrow className="mr-1" />
            : <BiSolidRightArrow className="mr-1" />
        }
        {content}
      </div>
      <div
        className={`${expanded ? 'visible' : 'hidden'}`}
      >
        {children}
      </div>
    </>
  );
}
