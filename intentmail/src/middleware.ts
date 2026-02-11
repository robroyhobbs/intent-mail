import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/waitlist",
  "/pricing",
  "/docs(.*)",
  "/api/webhooks(.*)",
  "/unsubscribe(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Redirect /sign-up to /waitlist (invite-only mode)
  if (request.nextUrl.pathname.startsWith("/sign-up")) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
