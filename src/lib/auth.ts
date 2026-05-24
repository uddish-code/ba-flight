import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

async function getDiscordRole(discordId: string): Promise<"HOST" | "MEMBER"> {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );
    if (!res.ok) return "MEMBER";
    const member = await res.json();
    const roles: string[] = member.roles || [];
    if (roles.includes(process.env.DISCORD_HOST_ROLE_ID!)) return "HOST";
    return "MEMBER";
  } catch (e) {
    console.error("Discord role fetch error:", e);
    return "MEMBER";
  }
}

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
        const existingUser = await prisma.user.findUnique({
          where: { discordId: profile.id },
        });

        const discordRole = await getDiscordRole(profile.id);
        const role = existingUser?.role === "ADMIN" ? "ADMIN" : discordRole;

        await prisma.user.upsert({
          where: { discordId: profile.id },
          update: {
            username: profile.username,
            avatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
            role,
          },
          create: {
            discordId: profile.id,
            username: profile.username,
            avatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
            role,
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
