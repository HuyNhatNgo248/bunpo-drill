import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";

/**
 * Rules for names, emails and passwords, shared by sign-up and the account page. Each returns the
 * error to show, for the action to translate into the request's language, or null.
 */

/** Emails are kept in lower case without spaces around them, so "Huy@Mail.com " finds the same account. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function checkEmail(email: string): MessageDescriptor | null {
  // shortcut: a shape check only, the reset email is the real proof; send a confirmation link if typos become a problem.
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : msg`That email address doesn't look right.`;
}

export function checkName(name: string): MessageDescriptor | null {
  if (name.length < 1 || name.length > 30) return msg`Use a username of 1 to 30 characters.`;
  // Sign-in takes a username or an email, so a name with "@" could be mistaken for someone's email.
  return name.includes("@") ? msg`A username can't contain “@”.` : null;
}

export function checkNewPassword(password: string): MessageDescriptor | null {
  return password.length >= 8 ? null : msg`Use a password of at least 8 characters.`;
}
