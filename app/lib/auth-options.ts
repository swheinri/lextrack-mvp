// app/lib/auth-options.ts
import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

const DEBUG = process.env.NODE_ENV !== 'production';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  debug: DEBUG,

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Passwort', type: 'password' },
      },

      async authorize(credentials) {
        const email = (credentials?.email ?? '').toLowerCase().trim();
        const password = credentials?.password ?? '';

        if (DEBUG) console.log('[auth] attempt:', email);

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: { select: { code: true, isActive: true } } },
        });

        if (!user || !user.isActive) return null;
        if (!user.passwordHash) return null;
        if (!user.role?.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role.code,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: { signIn: '/login' },
};
