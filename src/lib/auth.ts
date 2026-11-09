import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isLocalPreviewConfigured } from "@/lib/local-preview";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || (isLocalPreviewConfigured() ? "jarvis-local-preview-session-secret" : undefined),
  providers: [Google({ authorization: { params: { scope: "openid email profile" } } })],
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile }) {
      const allowedEmail = process.env.AUTH_ALLOWED_EMAIL?.toLowerCase();
      const email = profile?.email?.toLowerCase();
      return Boolean(allowedEmail && email === allowedEmail && profile?.email_verified !== false);
    },
    async jwt({ token, profile }) {
      if (profile?.sub) token.userId = profile.sub;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = String(token.userId ?? token.sub ?? "");
      return session;
    },
  },
});

export async function getCurrentViewer() {
  if (isLocalPreviewConfigured()) {
    return { id: "local-demo-user", name: "Daniel", email: "local@jarvis.dev", image: null };
  }
  const session = await auth();
  return session?.user ?? null;
}
