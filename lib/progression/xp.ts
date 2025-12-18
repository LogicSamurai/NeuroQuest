import { db } from "@/lib/db";
import { users, xpTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

// XP required for each level (exponential curve)
function getXpRequiredForLevel(level: number): number {
    // Base: 100 XP for level 2, scaling with 1.3x per level
    return Math.floor(100 * Math.pow(1.3, level - 1));
}

// Calculate level from total XP
function getLevelFromTotalXp(totalXp: number): { level: number; currentXp: number; xpForNextLevel: number } {
    let level = 1;
    let remainingXp = totalXp;

    while (remainingXp >= getXpRequiredForLevel(level)) {
        remainingXp -= getXpRequiredForLevel(level);
        level++;
    }

    return {
        level,
        currentXp: remainingXp,
        xpForNextLevel: getXpRequiredForLevel(level),
    };
}

// XP awards for different actions
export const XP_AWARDS = {
    // Game completion
    gameComplete: 15,
    gameWin: 25,
    perfectScore: 50,
    highScore: 30,

    // Daily actions
    dailyLogin: 10,
    streakBonus: (streak: number) => Math.min(streak * 5, 50), // 5 XP per day, max 50

    // Achievements
    achievementCommon: 25,
    achievementRare: 50,
    achievementEpic: 100,
    achievementLegendary: 200,

    // Challenges
    challengeComplete: 50,
    allChallengesComplete: 100,

    // Social
    friendAdded: 10,
    friendBeat: 20,

    // Multipliers
    weekendMultiplier: 1.5,
    eventMultiplier: 2.0,
};

export type XpSource = 'game' | 'achievement' | 'challenge' | 'login' | 'bonus' | 'social';

// Award XP to a user
export async function awardXp(
    userId: string,
    amount: number,
    source: XpSource,
    metadata?: Record<string, unknown>,
    multiplier: number = 1.0
) {
    const finalAmount = Math.floor(amount * multiplier);

    // Get current user
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    if (!user) return { success: false, error: 'User not found' };

    const newTotalXp = (user.totalXp || 0) + finalAmount;
    const levelInfo = getLevelFromTotalXp(newTotalXp);

    const oldLevel = user.level || 1;
    const newLevel = levelInfo.level;
    const leveledUp = newLevel > oldLevel;

    // Update user
    await db
        .update(users)
        .set({
            xp: levelInfo.currentXp,
            level: newLevel,
            totalXp: newTotalXp,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    // Record transaction
    await db.insert(xpTransactions).values({
        id: crypto.randomUUID(),
        userId,
        amount: finalAmount,
        source,
        multiplier,
        metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return {
        success: true,
        xpAwarded: finalAmount,
        newTotalXp,
        newLevel,
        currentXp: levelInfo.currentXp,
        xpForNextLevel: levelInfo.xpForNextLevel,
        leveledUp,
        oldLevel,
    };
}

// Get user's XP and level info
export async function getUserLevel(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);

    if (!user) {
        return {
            level: 1,
            currentXp: 0,
            totalXp: 0,
            xpForNextLevel: getXpRequiredForLevel(1),
            progress: 0,
        };
    }

    const xpForNextLevel = getXpRequiredForLevel(user.level || 1);

    return {
        level: user.level || 1,
        currentXp: user.xp || 0,
        totalXp: user.totalXp || 0,
        xpForNextLevel,
        progress: ((user.xp || 0) / xpForNextLevel) * 100,
    };
}

// Handle daily login bonus
export async function handleDailyLogin(userId: string, isGameCompletion: boolean = false) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.lastLoginDate;

    // Already logged in today
    if (lastLogin === today) {
        return { alreadyLoggedIn: true, streak: user.currentStreak };
    }

    // Calculate new streak
    let newStreak = user.currentStreak || 0;
    let freezeUsed = false;
    let freezesRemaining = user.streakFreezes || 0;
    let shouldUpdateDate = false;

    if (lastLogin) {
        const lastDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day
            if (isGameCompletion) {
                newStreak += 1;
                shouldUpdateDate = true;
            }
            // If not game completion, streak remains same, date remains same (until game played)
            // Actually, for consecutive day, we probably want to update date ONLY if game played?
            // Wait, if they visit, we don't want to break streak, but we don't want to increment.
            // If we don't update date, tomorrow diffDays will be 2.
            // So we MUST update date on visit to "mark as seen", OR we accept that visit doesn't count.
            // User said: "reseted to zero and then when user solves any challeneges or like that then only increase the streak"
            // This implies visit DOES NOT count for streak maintenance?
            // "streak not breaking as well as stresk freeze is not getting used" -> original issue.
            // "no it should be reseted to zero and then when user solves any challeneges or like that then only increase the streak like that.."
            // This implies:
            // 1. If I visit today (diff=1), streak is NOT incremented.
            // 2. If I DON'T play today, and come tomorrow (diff=2), streak BREAKS.
            // So visiting ALONE does NOT save the streak?
            // Usually in these apps, visiting KEEPS the streak alive (maintenance) but maybe doesn't increment?
            // OR, you HAVE to play to keep it alive.
            // Let's assume: You HAVE to play to keep it alive.
            // So visiting does NOTHING to the streak state if it's currently valid.
            // But if it's BROKEN (diff > 1), we need to reset it to 0 immediately on visit.
        } else if (diffDays > 1) {
            // Streak broken
            if (freezesRemaining > 0) {
                // Use freeze to save streak
                freezeUsed = true;
                freezesRemaining--;

                // If we use a freeze, we effectively "fill in" the missing day(s).
                // We set lastLoginDate to YESTERDAY so that today becomes a consecutive day.
                const yesterday = new Date(todayDate);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                // Update DB immediately for the freeze use
                await db.update(users).set({
                    lastLoginDate: yesterdayStr,
                    streakFreezes: freezesRemaining,
                    updatedAt: new Date(),
                }).where(eq(users.id, userId));

                // Now behave as if consecutive
                if (isGameCompletion) {
                    newStreak += 1;
                    shouldUpdateDate = true;
                }
            } else {
                // No freezes, reset to 0
                newStreak = 0;
                // Update DB immediately to reset streak
                await db.update(users).set({
                    currentStreak: 0,
                    updatedAt: new Date(),
                }).where(eq(users.id, userId));

                if (isGameCompletion) {
                    newStreak = 1;
                    shouldUpdateDate = true;
                }
            }
        }
    } else {
        // First ever login
        if (isGameCompletion) {
            newStreak = 1;
            shouldUpdateDate = true;
        } else {
            newStreak = 0;
        }
    }

    // Only update main streak/date if game completed
    if (shouldUpdateDate) {
        const longestStreak = Math.max(user.longestStreak || 0, newStreak);

        await db
            .update(users)
            .set({
                lastLoginDate: today,
                currentStreak: newStreak,
                longestStreak,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        // Award XP only on game completion
        const loginXp = XP_AWARDS.dailyLogin;
        const streakXp = XP_AWARDS.streakBonus(newStreak);
        const totalXp = loginXp + streakXp;

        const result = await awardXp(userId, totalXp, 'login', {
            loginXp,
            streakXp,
            streak: newStreak,
            freezeUsed,
        });

        return {
            alreadyLoggedIn: false,
            streak: newStreak,
            longestStreak,
            xpAwarded: totalXp,
            leveledUp: result.leveledUp,
            newLevel: result.newLevel,
            freezeUsed,
        };
    }

    return {
        alreadyLoggedIn: false,
        streak: newStreak,
        longestStreak: user.longestStreak || 0,
        xpAwarded: 0,
        leveledUp: false,
        newLevel: user.level || 1,
        freezeUsed,
    };
}

// Check if weekend multiplier applies
function isWeekendMultiplierActive(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6;
}

// Get current active multiplier
export function getCurrentMultiplier(): { value: number; reason: string | null } {
    if (isWeekendMultiplierActive()) {
        return { value: XP_AWARDS.weekendMultiplier, reason: 'Weekend Bonus' };
    }
    // Add more multiplier checks here (events, etc.)
    return { value: 1.0, reason: null };
}

// Get level milestones and rewards
export function getLevelRewards(level: number): string[] {
    const rewards: string[] = [];

    if (level >= 5) rewards.push('Unlocked: Profile Customization');
    if (level >= 10) rewards.push('Unlocked: Friend Challenges');
    if (level >= 15) rewards.push('Unlocked: Custom Avatars');
    if (level >= 20) rewards.push('Unlocked: Tournament Entry');
    if (level >= 25) rewards.push('Unlocked: Exclusive Badge');
    if (level >= 30) rewards.push('Unlocked: VIP Frame');
    if (level >= 50) rewards.push('Unlocked: Prestige Mode');

    return rewards;
}
