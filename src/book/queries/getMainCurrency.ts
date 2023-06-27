import { Account, Commodity } from '@/book/entities';

/**
 * In the current database schema there is no setting for storing the mainCurrency
 * gnucash stores this setting somewhere but seems it's internal. To workaround this
 * we are providing this query that counts the commodity used for each INCOME/EXPENSE
 * account. The one most common is assigned as mainCurrency.
 *
 * This function assumes users will have their INCOME and EXPENSE usually with the same
 * currency. If for some reason this is not the case, if may be buggy and change
 * mainCurrency
 *
 * If we don't find one, returns null
 */
export async function getMainCurrency(): Promise<Commodity> {
  const counts = await Account.query(
    `
    SELECT commodity_guid, COUNT(commodity_guid) as count
    FROM accounts
    WHERE account_type IN ('INCOME', 'EXPENSE')
    GROUP BY commodity_guid
    ORDER BY count DESC
    `,
  );

  if (!counts.length) {
    throw new Error('Not enough accounts exist to decide main currency from');
  }

  const mainCurrency = await Commodity.findOneByOrFail({ guid: counts[0].commodity_guid });
  return mainCurrency;
}
