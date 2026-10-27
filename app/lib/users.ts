/** Rules for names and passwords, shared by sign-up and the account page. Each returns the error to show, or null. */

export function checkName(name: string) {
  return name.length >= 1 && name.length <= 30 ? null : "名前は1〜30文字で入力してください。";
}

export function checkNewPassword(password: string) {
  return password.length >= 8 ? null : "パスワードは8文字以上にしてください。";
}
