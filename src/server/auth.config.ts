import type { NextAuthConfig } from "next-auth";

/** Edge-safe part of the auth config (no database), shared with proxy.ts. */
export const authConfig = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
