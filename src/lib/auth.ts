import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }: any) {
      if (!profile) return false;
      try {
        await prisma.user.upsert({
          where: { discordId: profile.id },
          update: {
            username: profile.username,
            avatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
          },
          create: {
            discordId: profile.id,
            username: profile.username,
            avatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
            role: "MEMBER",
          },
        });
        return true;
      } catch (e) {
        console.error("SignIn error:", e);
        return false;
      }
    },
    async session({ session, token }: any) {
      if (token?.discordId) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: token.discordId },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
          session.user.discordId = dbUser.discordId;
          session.user.avatar = dbUser.avatar;
          session.user.name = dbUser.username;
        }
      }
      return session;
    },
    async jwt({ token, profile }: any) {
      if (profile) {
        token.discordId = profile.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};
