/**
 * Runs `run` and returns what it throws: a Response for a redirect or a 401, or the `data(…)` of a 404.
 * Fails when `run` throws nothing.
 *
 * @example
 * expect(await thrownBy(() => loader(args))).toMatchObject({ init: { status: 404 } });
 */
export async function thrownBy(run: () => unknown): Promise<unknown> {
  try {
    await run();
  } catch (thrown) {
    return thrown;
  }
  throw new Error("expected a throw");
}
