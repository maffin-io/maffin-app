import classNames from 'classnames';

import { isAsset, isInvestment, isLiability } from '@/book/helpers/accountType';
import type { Account } from '@/book/entities';

export function accountColorCode(account?: Account, defaults?: string) {
  return classNames(defaults, {
    'bg-misc': account && isInvestment(account),
    'bg-primary': account?.type === 'EQUITY',
    'bg-info': account && isAsset(account),
    'bg-success': account?.type === 'INCOME',
    'bg-danger': account?.type === 'EXPENSE',
    'bg-warning': account && isLiability(account),
  });
}
