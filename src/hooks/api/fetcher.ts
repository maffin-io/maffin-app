export default function fetcher(f: () => Promise<any>, key: string) {
  return async () => {
    const start = performance.now();
    const r = await f();
    const end = performance.now();
    console.log(`${key}: ${end - start}ms`);
    return r;
  };
}
