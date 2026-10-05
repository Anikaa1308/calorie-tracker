import "server-only";
import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "./db";
import { rateLimit } from "./rate-limit";

export const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        try {
          rateLimit(`signin:${email}`, 10, 15 * 60_000);
        } catch {
          throw new RateLimited();
        }
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google") {
        const email = (profile?.email ?? token.email)?.toLowerCase();
        if (!email || profile?.email_verified === false) throw new Error("Google account email isn't verified.");
        const u = await db.user.upsert({
          where: { email },
          create: { email, name: profile?.name ?? null, image: (profile?.picture as string) ?? null, emailVerified: new Date() },
          update: {},
        });
        await db.account.upsert({
          where: { provider_providerAccountId: { provider: "google", providerAccountId: account.providerAccountId } },
          create: { userId: u.id, type: account.type, provider: "google", providerAccountId: account.providerAccountId },
          update: {},
        });
        token.uid = u.id;
      } else if (user?.id) {
        token.uid = user.id;
      }
      return token;
    },
  },
});

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
