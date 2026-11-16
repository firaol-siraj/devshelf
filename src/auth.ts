import "server-only";

import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { serverEnv } from "@/lib/env/server";
import { verifyCredentials } from "@/lib/auth/credentials";

export async function handleJwtCallback({
  token,
  user,
}: {
  token: JWT;
  user?: User | null;
}): Promise<JWT> {
  if (user?.id) {
    token.id = user.id;
  }

  return token;
}

export async function handleSessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Promise<Session> {
  if (session.user) {
    if (typeof token.id === "string") {
      session.user.id = token.id;
    } else if (typeof token.sub === "string") {
      session.user.id = token.sub;
    }
  }

  return session;
}

export const authConfig: NextAuthConfig = {
  secret: serverEnv.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        return verifyCredentials(credentials);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      return handleJwtCallback({ token, user });
    },
    session({ session, token }) {
      return handleSessionCallback({ session, token });
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
