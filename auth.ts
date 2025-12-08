import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { users } from "@/db/schema"
import { generateFriendCode } from "@/lib/auth/identity"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db),
    providers: [Google],
    secret: process.env.AUTH_SECRET || "development_secret_key_change_me",
    callbacks: {
        session({ session, user }) {
            session.user.id = user.id
            return session
        },
    },
    events: {
        createUser: async ({ user }) => {
            if (user.id) {
                await db.update(users).set({
                    friendCode: generateFriendCode(),
                    xp: 0,
                    level: 1,
                    totalXp: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    streakFreezes: 0,
                }).where(eq(users.id, user.id))
            }
        }
    }
})
