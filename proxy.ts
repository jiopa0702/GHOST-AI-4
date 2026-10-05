import { clerkMiddleware } from "@clerk/nextjs/server";

const signInRoute = (process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in").replace(/^\/+/, "");
const signUpRoute = (process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up").replace(/^\/+/, "");

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const isPublicRoute =
    pathname === "/" ||
    pathname === `/${signInRoute}` ||
    pathname.startsWith(`/${signInRoute}/`) ||
    pathname === `/${signUpRoute}` ||
    pathname.startsWith(`/${signUpRoute}/`) ||
    pathname.startsWith("/clerk/") ||
    pathname === "/clerk";
  const isProjectApiRoute =
    pathname === "/api/projects" || pathname.startsWith("/api/projects/");

  if (!isPublicRoute && !isProjectApiRoute) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map)).*)",
    "/",
  ],
};
