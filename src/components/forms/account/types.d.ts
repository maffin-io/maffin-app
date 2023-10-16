export type FormValues = {
  guid?: string,
  name: string,
  parent: Account,
  fk_commodity: Commodity,
  type: string,
  balance?: number,
  balanceDate?: string,
  hidden: boolean,
  placeholder: boolean,
};
