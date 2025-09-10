import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

import AppMiddleware from "@/lib/middleware/app";
import DomainMiddleware from "@/lib/middleware/domain";

import { BLOCKED_PATHNAMES } from "./lib/constants";
import IncomingWebhookMiddleware, {
  isWebhookPath,
} from "./lib/middleware/incoming-webhooks";
import PostHogMiddleware from "./lib/middleware/posthog";

function isAnalyticsPath(path: string) {
  // Create a regular expression
  // ^ - asserts position at start of the line
  // /ingest/ - matches the literal string "/ingest/"
  // .* - matches any character (except for line terminators) 0 or more times
  const pattern = /^\/ingest\/.*/;

  return pattern.test(path);
}

function parseHostFromUrl(envUrl?: string | null): string | null {
  if (!envUrl) return null;
  try {
    return new URL(envUrl).host;
  } catch {
    // If it's already a host without scheme, return as-is
    return envUrl.includes("/") ? null : envUrl;
  }
}

function isCustomDomain(host: string) {
  const appBaseHost = process.env.NEXT_PUBLIC_APP_BASE_HOST || undefined;
  const authUrlHost = parseHostFromUrl(process.env.NEXTAUTH_URL || undefined);
  const marketingUrlHost = parseHostFromUrl(
    process.env.NEXT_PUBLIC_MARKETING_URL || undefined,
  );
  const webhookBaseHost = process.env.NEXT_PUBLIC_WEBHOOK_BASE_HOST || undefined;

  const allowHosts = new Set(
    [
      "localhost",
      appBaseHost,
      authUrlHost,
      marketingUrlHost,
      webhookBaseHost,
    ]
      .filter(Boolean)
      .map((h) => h!.toLowerCase()),
  );

  const h = (host || "").toLowerCase();

  // Local dev allowances
  if (process.env.NODE_ENV === "development") {
    if (h.includes(".local") || h.includes("papermark.dev")) return true;
    // Treat configured hosts as non-custom in dev too
    if (allowHosts.has(h)) return false;
    return false; // Default to app domain in dev
  }

  // Treat known first-party domains and configured hosts as non-custom
  if (
    h.includes("papermark.io") ||
    h.includes("papermark.com") ||
    h.endsWith(".vercel.app") ||
    allowHosts.has(h)
  ) {
    return false;
  }

  // Everything else is a custom viewer domain
  return true;
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!api/|_next/|_static|vendor|_icons|_vercel|favicon.ico|sitemap.xml).*)",
  ],
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  if (isAnalyticsPath(path)) {
    return PostHogMiddleware(req);
  }

  // Handle incoming webhooks
  if (isWebhookPath(host)) {
    return IncomingWebhookMiddleware(req);
  }

  // For custom domains, we need to handle them differently
  // Allow critical app routes to bypass the custom-domain rewrite
  if (
    isCustomDomain(host || "") &&
    !path.startsWith("/verify") &&
    !path.startsWith("/login") &&
    !path.startsWith("/auth")
  ) {
    return DomainMiddleware(req);
  }

  // Handle standard papermark.io paths
  if (
    !path.startsWith("/view/") &&
    !path.startsWith("/verify") &&
    !path.startsWith("/unsubscribe")
  ) {
    return AppMiddleware(req);
  }

  // Check for blocked pathnames in view routes
  if (
    path.startsWith("/view/") &&
    (BLOCKED_PATHNAMES.some((blockedPath) => path.includes(blockedPath)) ||
      path.includes("."))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
  }

  return NextResponse.next();
}
