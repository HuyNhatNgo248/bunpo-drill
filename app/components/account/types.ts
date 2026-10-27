/** What the account action answers: the form it is for, and an error or a saved message. */
export type AccountResult = { form: "name" | "email" | "password"; error?: string; saved?: string };
