import NextAuth, { Account } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import { JWT } from "next-auth/jwt";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID as string,
      clientSecret: process.env.FACEBOOK_SECRET as string,
    }),
  ],
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        session.user.provider = token.provider;
      }
      return session;
    },
    jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account?.provider) {
        token.provider = account.provider;
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
