import { describe, expect, it } from "vitest";
import { checkEmail, checkName, checkNewPassword, normalizeEmail } from "./users";

describe("checkName", () => {
  it("accepts a name of 1 to 30 characters", () => {
    expect(checkName("H")).toBeNull();
    expect(checkName("フイ")).toBeNull();
    expect(checkName("a".repeat(30))).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(checkName("")).toBe("ユーザー名は1〜30文字で入力してください。");
  });

  it("rejects a name of more than 30 characters", () => {
    expect(checkName("a".repeat(31))).toBe("ユーザー名は1〜30文字で入力してください。");
  });

  it("rejects a name with @, which sign-in would read as an email", () => {
    expect(checkName("huy@home")).toBe("ユーザー名に「@」は使えません。");
  });
});

describe("checkNewPassword", () => {
  it("accepts a password of 8 characters or more", () => {
    expect(checkNewPassword("12345678")).toBeNull();
    expect(checkNewPassword("a long passphrase")).toBeNull();
  });

  it("rejects a password of fewer than 8 characters", () => {
    expect(checkNewPassword("1234567")).toBe("パスワードは8文字以上にしてください。");
    expect(checkNewPassword("")).toBe("パスワードは8文字以上にしてください。");
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
    expect(checkEmail("huy.example.com")).toBe("メールアドレスの形式が正しくありません。");
    expect(checkEmail("huy@example")).toBe("メールアドレスの形式が正しくありません。");
    expect(checkEmail("")).toBe("メールアドレスの形式が正しくありません。");
  });

  it("rejects an address with spaces, or longer than 254 characters", () => {
    expect(checkEmail("huy ngo@example.com")).not.toBeNull();
    expect(checkEmail(`${"a".repeat(250)}@example.com`)).not.toBeNull();
  });
});
