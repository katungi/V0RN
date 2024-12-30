import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { compare } from 'bcrypt-ts';
import { db } from '@/lib/db/db-client';
import { createWelcomeChat, getUserByEmail } from '@/lib/db/schema/server-actions';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db),
  pages: {
    signIn: '/sign-in',
    newUser: '/',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
    //   if (account?.provider === 'github') {
    //     const users = await getUserByEmail(user.email!);
    //     if (users.length === 0) {
    //       await createWelcomeChat(user.id!);
    //     }
    //   }
      return true;
    },
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const users = await getUserByEmail(credentials.email as string);
        if (!users || users.length === 0) return null;
        
        const user = users[0];
        if (!user?.password) return null;
        
        const passwordsMatch = await compare(credentials.password as string, user.password);
        if (!passwordsMatch) return null;
        
        return {
          id: user.id,
          name: user.email.split('@')[0],
          email: user.email,
          image: null,
        };
      },
    }),
  ],
};

export const { auth, handlers: { GET, POST }, signIn, signOut } = NextAuth(authConfig);
