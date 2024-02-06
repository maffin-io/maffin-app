export function isStaging() {
  return process.env.NEXT_PUBLIC_ENV === 'staging';
}

export function isProd() {
  return process.env.NEXT_PUBLIC_ENV === 'master';
}
