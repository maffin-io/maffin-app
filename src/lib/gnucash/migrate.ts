import {
  Account,
} from '@/book/entities';

export default async function migrate() {
  await Promise.all([
    Account.delete({
      type: 'ROOT',
      name: 'Template Root',
    }),
    Account.update(
      { type: 'STOCK' },
      { type: 'INVESTMENT' },
    ),
    Account.update(
      { type: 'MUTUAL' },
      { type: 'INVESTMENT' },
    ),
  ]);
}
