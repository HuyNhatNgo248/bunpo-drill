/** Rules for names, emails and passwords, shared by sign-up and the account page. Each returns the error to show, or null. */

/** Emails are kept in lower case without spaces around them, so "Huy@Mail.com " finds the same account. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function checkEmail(email: string) {
  // shortcut: a shape check only, the reset email is the real proof; send a confirmation link if typos become a problem.
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "メールアドレスの形式が正しくありません。";
}

export function checkName(name: string) {
  if (name.length < 1 || name.length > 30) return "ユーザー名は1〜30文字で入力してください。";
  // Sign-in takes a username or an email, so a name with "@" could be mistaken for someone's email.
  return name.includes("@") ? "ユーザー名に「@」は使えません。" : null;
}

export function checkNewPassword(password: string) {
  return password.length >= 8 ? null : "パスワードは8文字以上にしてください。";
}
