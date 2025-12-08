import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Streak freeze configuration
const STREAK_FREEZE_COST = 500; // XP cost to purchase a freeze
const MAX_STREAK_FREEZES = 3; // Maximum freezes a user can hold

// Check if user can afford a streak freeze
export async function canPurchaseStreakFreeze(userId: string): Promise<boolean> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    if (!user) return false;

    const currentFreezes = user.streakFreezes || 0;
    const totalXp = user.totalXp || 0;

    return currentFreezes < MAX_STREAK_FREEZES && totalXp >= STREAK_FREEZE_COST;
}

// Purchase a streak freeze
export async function purchaseStreakFreeze(userId: string): Promise<{ success: boolean; error?: string }> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    if (!user) return { success: false, error: 'User not found' };

    const currentFreezes = user.streakFreezes || 0;
    const totalXp = user.totalXp || 0;

    if (currentFreezes >= MAX_STREAK_FREEZES) {
        return { success: false, error: `Maximum ${MAX_STREAK_FREEZES} freezes allowed` };
    }

    if (totalXp < STREAK_FREEZE_COST) {
        return { success: false, error: `Need ${STREAK_FREEZE_COST} XP to purchase` };
    }

    await db
        .update(users)
        .set({
            streakFreezes: currentFreezes + 1,
            totalXp: totalXp - STREAK_FREEZE_COST,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    return { success: true };
}

// Use a streak freeze when streak would break
export async function useStreakFreeze(userId: string): Promise<boolean> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    if (!user) return false;

    const currentFreezes = user.streakFreezes || 0;

    if (currentFreezes <= 0) return false;

    await db
        .update(users)
        .set({
            streakFreezes: currentFreezes - 1,
            lastLoginDate: new Date().toISOString().split('T')[0], // Mark as "logged in"
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    return true;
}

// Check if streak would break and auto-apply freeze
export async function checkStreakProtection(userId: string): Promise<{
    wouldBreak: boolean;
    freezeApplied: boolean;
    freezesRemaining: number;
}> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    if (!user) return { wouldBreak: false, freezeApplied: false, freezesRemaining: 0 };

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.lastLoginDate;

    // Already logged in today
    if (lastLogin === today) {
        return { wouldBreak: false, freezeApplied: false, freezesRemaining: user.streakFreezes || 0 };
    }

    // Check if streak would break (more than 1 day gap)
    if (lastLogin) {
        const lastDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 1 && user.currentStreak && user.currentStreak > 0) {
            // Streak would break - try to apply freeze
            const freezeApplied = await useStreakFreeze(userId);

            return {
                wouldBreak: true,
                freezeApplied,
                freezesRemaining: (user.streakFreezes || 0) - (freezeApplied ? 1 : 0),
            };
        }
    }

    return { wouldBreak: false, freezeApplied: false, freezesRemaining: user.streakFreezes || 0 };
}

// Daily rewards calendar configuration
const DAILY_REWARDS = [
    { day: 1, xp: 10, description: "Day 1 bonus" },
    { day: 2, xp: 15, description: "Day 2 bonus" },
    { day: 3, xp: 20, description: "Day 3 bonus" },
    { day: 4, xp: 25, description: "Day 4 bonus" },
    { day: 5, xp: 30, description: "Day 5 bonus" },
    { day: 6, xp: 40, description: "Day 6 bonus" },
    { day: 7, xp: 100, description: "Week complete!", special: true },
];

// Get current week's reward status
export async function getWeeklyRewardStatus(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    if (!user) {
        return {
            currentDay: 0,
            weekNumber: 0,
            streak: 0,
            rewards: DAILY_REWARDS,
            claimed: [] as number[],
            nextReward: DAILY_REWARDS[0] || null,
        };
    }

    const streak = user.currentStreak || 0;
    const dayInWeek = streak === 0 ? 0 : ((streak - 1) % 7) + 1; // 0 for no streak, 1-7 otherwise

    // Calculate which rewards have been claimed this week
    const weekNumber = streak === 0 ? 0 : Math.floor((streak - 1) / 7);
    const claimedDays: number[] = [];
    for (let i = 1; i <= dayInWeek; i++) {
        claimedDays.push(i);
    }

    return {
        currentDay: dayInWeek,
        weekNumber,
        streak,
        rewards: DAILY_REWARDS,
        claimed: claimedDays,
        nextReward: dayInWeek < 7 ? DAILY_REWARDS[dayInWeek] : null,
    };
}

// Get streak freeze status
export async function getStreakFreezeStatus(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);

    return {
        freezesOwned: user?.streakFreezes || 0,
        maxFreezes: MAX_STREAK_FREEZES,
        freezeCost: STREAK_FREEZE_COST,
        canPurchase: await canPurchaseStreakFreeze(userId),
    };
}
