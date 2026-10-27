import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/helpers/logout.ts"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("account", "routes/account.tsx"),
  route("tests/:id", "routes/quiz.tsx"),
  route("tests/:id/results", "routes/results.tsx"),
  route("tests/:id/retake", "routes/helpers/retake.ts"),
  route("api/tests", "routes/helpers/api.tests.ts"),
  route("api/tests/:id", "routes/helpers/api.tests.$id.ts"),
] satisfies RouteConfig;
