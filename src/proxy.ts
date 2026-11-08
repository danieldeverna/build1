import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isLocalPreviewConfigured } from "@/lib/local-preview";

export default auth((request) => {
  const isLoopback = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  const isBypassed = isLoopback && isLocalPreviewConfigured();
  if (request.auth || isBypassed) return NextResponse.next();
  const signInUrl = new URL("/sign-in", request.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = { matcher: ["/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)"] };
