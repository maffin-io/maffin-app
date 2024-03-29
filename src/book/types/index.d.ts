import type { DateTime } from "luxon";

export type QuoteInfo = {
  changePct: number,
  changeAbs: number,
  price: number,
  currency: string,
  date: DateTime,
};
