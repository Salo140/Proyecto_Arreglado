declare namespace Deno {
  type Env = {
    get(name: string): string | undefined;
  };

  const env: Env;
}
