/**
 * The settings that vitest.setup.ts gives every test file. The values are not real secrets.
 * A test that checks a secret imports it from here, so the test and the setup cannot disagree.
 */

export const SESSION_SECRET = "test-session-secret";

/** The sign-up code (APP_PASSWORD). */
export const SIGNUP_CODE = "test-signup-code";

export const API_TOKEN = "test-api-token";
