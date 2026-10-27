import { afterEach, describe, expect, it, vi } from "vitest";
import { requiredEnv } from "./env.server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env.server", () => {
  it("does not let .env replace a setting that is already set", () => {
    // vitest.setup.ts sets an empty TURSO_DATABASE_URL before this module loads .env.
    // If .env won, the tests would write to the Turso database that .env names.
    expect(process.env.TURSO_DATABASE_URL).toBe("");
  });
});

describe("requiredEnv", () => {
  it("returns the value of a setting", () => {
    vi.stubEnv("BUNPO_TEST_SETTING", "value");

    expect(requiredEnv("BUNPO_TEST_SETTING")).toBe("value");
  });

  it("throws an error that names a missing setting", () => {
    expect(() => requiredEnv("BUNPO_MISSING_SETTING")).toThrow(
      "BUNPO_MISSING_SETTING is not set. Add it to .env (see .env.example) or to the host's settings.",
    );
  });

  it("treats an empty setting as missing", () => {
    vi.stubEnv("BUNPO_TEST_SETTING", "");

    expect(() => requiredEnv("BUNPO_TEST_SETTING")).toThrow("BUNPO_TEST_SETTING is not set.");
  });
});
