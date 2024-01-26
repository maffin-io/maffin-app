export function isStaging() {
  return process.env.NEXT_PUBLIC_ENV === 'staging';
}
