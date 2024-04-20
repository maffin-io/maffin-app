import Split from './Split';

export const splitOps = {
  isSameCommodity: (a: Split, b: Split) => (
    a.account?.commodity?.guid === b.account?.commodity?.guid
  ),
};
