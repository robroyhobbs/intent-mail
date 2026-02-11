import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

// Clerk middleware handler (used when keys are configured)
const clerkHandler = clerkMiddleware(async (auth, request) => {
  // Redirect /sign-up to /waitlist (invite-only mode)
  if (request.nextUrl.pathname.startsWith("/sign-up")) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: NextRequest, event: any) {
  const { pathname } = request.nextUrl;

  // Redirect /sign-up to /waitlist (invite-only mode) — always active
  if (pathname.startsWith("/sign-up")) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  // If Clerk is not configured, allow public routes only
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  // Clerk is configured — delegate to Clerk middleware
  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
