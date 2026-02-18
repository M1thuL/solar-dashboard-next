// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword, findUserByEmail } from '../../../lib/db';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await verifyPassword(credentials.email, credentials.password);
        if (!user) {
          // return null to indicate invalid login
          return null;
        }
        // NextAuth expects an object with at least id and name/email
        return { id: String(user.id), email: user.email, name: user.name || user.email };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  jwt: {},
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = { id: user.id, email: user.email };
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      if (token?.user) {
        session.user.id = token.user.id;
        session.user.email = token.user.email;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      return baseUrl + '/';   // ALWAYS redirect to homepage
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
