import { i18n } from "@lingui/core";
import { describe, expect, it } from "vitest";
import { checkEmail as checkEmailOf, checkName as checkNameOf, checkNewPassword as checkNewPasswordOf, normalizeEmail } from "./users";

/** Each check in English, the language of the tests, or null when it passes. */
const english = <T,>(check: (value: T) => ReturnType<typeof checkNameOf>) => (value: T) => {
  const error = check(value);
  return error && i18n._(error);
};
const checkName = english(checkNameOf);
const checkNewPassword = english(checkNewPasswordOf);
const checkEmail = english(checkEmailOf);

describe("checkName", () => {
  it("accepts a name of 1 to 30 characters", () => {
    expect(checkName("H")).toBeNull();
    expect(checkName("フイ")).toBeNull();
    expect(checkName("a".repeat(30))).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(checkName("")).toBe("Use a username of 1 to 30 characters.");
  });

  it("rejects a name of more than 30 characters", () => {
    expect(checkName("a".repeat(31))).toBe("Use a username of 1 to 30 characters.");
  });

  it("rejects a name with @, which sign-in would read as an email", () => {
    expect(checkName("huy@home")).toBe("A username can't contain “@”.");
  });
});

describe("checkNewPassword", () => {
  it("accepts a password of 8 characters or more", () => {
    expect(checkNewPassword("12345678")).toBeNull();
    expect(checkNewPassword("a long passphrase")).toBeNull();
  });

  it("rejects a password of fewer than 8 characters", () => {
    expect(checkNewPassword("1234567")).toBe("Use a password of at least 8 characters.");
    expect(checkNewPassword("")).toBe("Use a password of at least 8 characters.");
  });
});

describe("normalizeEmail", () => {
  it("drops the spaces around an email and writes it in lower case", () => {
    expect(normalizeEmail("  Huy@Example.COM ")).toBe("huy@example.com");
  });
});

describe("checkEmail", () => {
  it("accepts an address with a name, an @ and a domain", () => {
    expect(checkEmail("huy@example.com")).toBeNull();
    expect(checkEmail("huy.ngo+bunpo@mail.example.jp")).toBeNull();
  });

  it("rejects an address without an @ or without a domain", () => {
    expect(checkEmail("huy.example.com")).toBe("That email address doesn't look right.");
    expect(checkEmail("huy@example")).toBe("That email address doesn't look right.");
    expect(checkEmail("")).toBe("That email address doesn't look right.");
  });

  it("rejects an address with spaces, or longer than 254 characters", () => {
    expect(checkEmail("huy ngo@example.com")).not.toBeNull();
    expect(checkEmail(`${"a".repeat(250)}@example.com`)).not.toBeNull();
  });
});
