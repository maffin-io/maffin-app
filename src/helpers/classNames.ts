import classNames from 'classnames';

import { isAsset, isInvestment, isLiability } from '@/book/helpers/accountType';
import type { Account } from '@/book/entities';

export function accountColorCode(account?: Account, defaults?: string) {
  return classNames(defaults, {
    misc: account && isInvestment(account),
    default: account?.type === 'EQUITY',
    success: account?.type === 'INCOME',
    danger: account?.type === 'EXPENSE',
    warning: account && isLiability(account),
    info: account && isAsset(account),
  });
}
