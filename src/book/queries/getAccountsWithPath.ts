import { FindOptionsRelations, Not } from 'typeorm';
import { Account, Book } from '../entities';

type AccountPath = {
  guid: string,
  type: string,
  path: string,
  commodity: string,
  commodityGuid: string,
};

type GetAccountsWithPathProps = {
  showRoot?: boolean,
  relations?: FindOptionsRelations<Account>,
};

export async function getAccountsWithPath(
  {
    showRoot = false,
    relations = {},
  }: GetAccountsWithPathProps = {},
): Promise<Account[]> {
  const start = performance.now();
  const books = await Book.find();
  const rootAccount = books[0].root;

  const typeFilter = !showRoot ? { type: Not('ROOT') } : {};

  const [accountsPaths, accounts] = await Promise.all([
    Account.query(
      `
      WITH RECURSIVE absolute_names(guid, name, parent_guid, path) AS (
        SELECT guid, name, parent_guid, name FROM accounts WHERE parent_guid = $1
        UNION ALL
        SELECT a.guid, a.name, a.parent_guid, p.path || ':' || a.name
        FROM accounts AS a JOIN absolute_names AS p ON a.parent_guid = p.guid
      )
      SELECT guid, path 
      FROM absolute_names
      `,
      [rootAccount.guid],
    ),
    Account.find({
      where: typeFilter,
      relations,
    }),
  ]);

  accounts.forEach((account) => {
    const accountPath = accountsPaths.find(
      (ap: AccountPath) => ap.guid === account.guid,
    );

    if (showRoot && account.type === 'ROOT') {
      account.path = 'Root';
    } else {
      account.path = accountPath.path;
    }
  });

  const end = performance.now();
  console.log(`get accounts with paths: ${end - start}ms`);

  return accounts;
}
