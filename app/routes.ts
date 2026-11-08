import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // The grammar, kanji and notes pages share their header and tabs.
  layout("routes/tabs.tsx", [
    index("routes/home.tsx"),
    route("kanji", "routes/kanji.tsx"),
    route("reading", "routes/reading.tsx"),
    route("notes", "routes/notes.tsx"),
  ]),
  route("welcome", "routes/welcome.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("login", "routes/helpers/login.ts"),
  route("logout", "routes/helpers/logout.ts"),
  route("locale", "routes/helpers/locale.ts"),
  route("last-tab", "routes/helpers/last-tab.ts"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("account", "routes/account.tsx"),
  route("info/:subject", "routes/info.tsx"),
  route("kanji/:level/:chapter/cards", "routes/flashcards.tsx"),
  route("notes/cards", "routes/note-cards.tsx"),
  route("tests/:id", "routes/quiz.tsx"),
  route("tests/:id/results", "routes/results.tsx"),
  route("tests/:id/retake", "routes/helpers/retake.ts"),
  route("tests/:id/check", "routes/helpers/check.ts"),
  route("tests/:id/draft", "routes/helpers/draft.ts"),
  route("try/:id", "routes/try.tsx"),
  route("try/:id/check", "routes/helpers/try-check.ts"),
  route("api/tests", "routes/helpers/api.tests.ts"),
  route("api/tests/:id", "routes/helpers/api.tests.$id.ts"),
  route("api/kanji/chapters", "routes/helpers/api.kanji.chapters.ts"),
] satisfies RouteConfig;
