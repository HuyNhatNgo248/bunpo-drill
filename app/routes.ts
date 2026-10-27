import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.ts"),
  route("tests/:id", "routes/quiz.tsx"),
  route("tests/:id/watch", "routes/watch.tsx"),
  route("tests/:id/results", "routes/results.tsx"),
  route("tests/:id/retake", "routes/retake.ts"),
  route("api/tests", "routes/api.tests.ts"),
  route("api/tests/:id", "routes/api.test.ts"),
] satisfies RouteConfig;
