import type { DateTime } from 'luxon';
import type { CellObject } from 'write-excel-file/browser';

import type Money from '@/book/Money';

export const HEADER_STYLE: CellObject = {
  fontWeight: 'bold',
  bottomBorderStyle: 'thin',
};

/**
 * Excel dates have no timezone and the library converts using UTC,
 * so the calendar day is pinned to UTC midnight to avoid off by one days.
 */
export function dateCell(date: DateTime): CellObject {
  return {
    value: new Date(Date.UTC(date.year, date.month - 1, date.day)),
    type: Date,
    format: 'dd/mm/yyyy',
  };
}

export function amountCell(amount: Money): CellObject {
  return {
    value: amount.toNumber(),
    type: Number,
    format: '#,##0.00',
  };
}
