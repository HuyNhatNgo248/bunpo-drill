import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("welcome", "routes/welcome.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("login", "routes/helpers/login.ts"),
  route("logout", "routes/helpers/logout.ts"),
  route("locale", "routes/helpers/locale.ts"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("account", "routes/account.tsx"),
  route("tests/:id", "routes/quiz.tsx"),
  route("tests/:id/results", "routes/results.tsx"),
  route("tests/:id/retake", "routes/helpers/retake.ts"),
  route("tests/:id/check", "routes/helpers/check.ts"),
  route("api/tests", "routes/helpers/api.tests.ts"),
  route("api/tests/:id", "routes/helpers/api.tests.$id.ts"),
  route("api/kanji/chapters", "routes/helpers/api.kanji.chapters.ts"),
] satisfies RouteConfig;
