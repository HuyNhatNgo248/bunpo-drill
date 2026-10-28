/**
 * The settings that vitest.setup.ts gives every test file. The values are not real secrets.
 * A test that checks a secret imports it from here, so the test and the setup cannot disagree.
 */

export const SESSION_SECRET = "test-session-secret";

export const API_TOKEN = "test-api-token";

/** The address that reset links start with. */
export const APP_URL = "https://bunpo.test";

export const MAIL_FROM = "文法ドリル <noreply@bunpo.test>";
