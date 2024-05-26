export const IS_PAID_PLAN: boolean = process.env.NEXT_PUBLIC_ENV === 'master';
export const IS_DEMO_PLAN = !IS_PAID_PLAN;
