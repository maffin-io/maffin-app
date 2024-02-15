export default function fetcher(f: () => Promise<any>, key: unknown) {
  return async () => {
    const start = performance.now();
    const r = await f();
    const end = performance.now();
    console.log(`${JSON.stringify(key)}: ${end - start}ms`);
    return r;
  };
}
