import { describe, expect, it } from "vitest";
import { checkName, checkNewPassword } from "./users";

describe("checkName", () => {
  it("accepts a name of 1 to 30 characters", () => {
    expect(checkName("H")).toBeNull();
    expect(checkName("フイ")).toBeNull();
    expect(checkName("a".repeat(30))).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(checkName("")).toBe("名前は1〜30文字で入力してください。");
  });

  it("rejects a name of more than 30 characters", () => {
    expect(checkName("a".repeat(31))).toBe("名前は1〜30文字で入力してください。");
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
