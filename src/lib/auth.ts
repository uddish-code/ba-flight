import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

const GUILD_ID = process.env.DISCORD_GUILD_ID!;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const HOST_ROLE = process.env.DISCORD_HOST_ROLE_ID!;
const ECONOMY_ROLE = "1016034180431360115";
const BUSINESS_ROLE = "1016034180431360116";
const FIRST_CLASS_ROLE = "1016034180431360119";

async function getDiscordRoles(discordId: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
      {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }
    );
    if (!res.ok) return [];
    const member = await res.json();
    return member.roles || [];
  } catch (e) {
    console.error("Discord role fetch error:", e);
    return [];
  }
}

function getPortalRole(
  roles: string[],
  existingRole: string | null
): "ADMIN" | "HOST" | "MEMBER" {
  if (existingRole === "ADMIN") return "ADMIN";
  if (roles.includes(HOST_ROLE)) return "HOST";
  return "MEMBER";
}

function getTicketClass(roles: string[]): string {
  if (roles.includes(FIRST_CLASS_ROLE)) return "FIRST_CLASS";
  if (roles.includes(BUSINESS_ROLE)) return "BUSINESS";
  return "ECONOMY";
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
        const discordRoles = await getDiscordRoles(profile.id);
        const existingUser = await prisma.user.findUnique({
          where: { discordId: profile.id },
        });
        const portalRole = getPortalRole(discordRoles, existingUser?.role ?? null);
        const ticketClass = getTicketClass(discordRoles);

        await prisma.user.upsert({
          where: { discordId: profile.id },
          update: {
            username: profile.username,
            avatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
            role: portalRole,
          },
          create: {
            discordId: profile.id,
            username: profile.username,
            avatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
            role: portalRole,
            baMiles: 0,
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
          session.user.baMiles = dbUser.baMiles;
        }
        const discordRoles = await getDiscordRoles(token.discordId);
        session.user.ticketClass = getTicketClass(discordRoles);
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
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
};
