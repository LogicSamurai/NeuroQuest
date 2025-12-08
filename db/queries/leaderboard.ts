import { db } from "@/lib/db";
import { leaderboardEntries, users, globalStats } from "@/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";

// Period helpers (non-async utility)
function getCurrentPeriodKey(period: 'daily' | 'weekly' | 'monthly' | 'alltime'): string {
    const now = new Date();
    switch (period) {
        case 'daily':
            return now.toISOString().split('T')[0]; // YYYY-MM-DD
        case 'weekly':
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
            return `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        case 'monthly':
            return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        case 'alltime':
            return 'alltime';
    }
}

// Get leaderboard entries for a specific game and period
export async function getLeaderboard(
    gameId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime',
    limit: number = 100
) {
    const periodKey = getCurrentPeriodKey(period);

    const entries = await db
        .select({
            id: leaderboardEntries.id,
            userId: leaderboardEntries.userId,
            userName: users.name,
            userAvatar: users.avatarUrl,
            userLevel: users.level,
            score: leaderboardEntries.score,
            rank: leaderboardEntries.rank,
            percentile: leaderboardEntries.percentile,
            previousRank: leaderboardEntries.previousRank,
            metadata: leaderboardEntries.metadata,
            updatedAt: leaderboardEntries.updatedAt,
        })
        .from(leaderboardEntries)
        .leftJoin(users, eq(leaderboardEntries.userId, users.id))
        .where(
            and(
                eq(leaderboardEntries.gameId, gameId),
                eq(leaderboardEntries.period, period),
                eq(leaderboardEntries.periodKey, periodKey)
            )
        )
        .orderBy(desc(leaderboardEntries.score))
        .limit(limit);

    return entries;
}

// Get user's rank and stats for a specific game
export async function getUserRank(
    userId: string,
    gameId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime'
) {
    const periodKey = getCurrentPeriodKey(period);

    const entry = await db
        .select()
        .from(leaderboardEntries)
        .where(
            and(
                eq(leaderboardEntries.userId, userId),
                eq(leaderboardEntries.gameId, gameId),
                eq(leaderboardEntries.period, period),
                eq(leaderboardEntries.periodKey, periodKey)
            )
        )
        .limit(1)
        .then(res => res[0]);

    // Get total players in this leaderboard
    const totalPlayers = await db
        .select({ count: count() })
        .from(leaderboardEntries)
        .where(
            and(
                eq(leaderboardEntries.gameId, gameId),
                eq(leaderboardEntries.period, period),
                eq(leaderboardEntries.periodKey, periodKey)
            )
        )
        .limit(1)
        .then(res => res[0]);

    return {
        rank: entry?.rank || null,
        score: entry?.score || 0,
        percentile: entry?.percentile || null,
        previousRank: entry?.previousRank || null,
        totalPlayers: totalPlayers?.count || 0,
    };
}

// Update or create leaderboard entry after game completion
export async function updateLeaderboardEntry(
    userId: string,
    gameId: string,
    score: number,
    metadata?: Record<string, unknown>
) {
    const periods: ('daily' | 'weekly' | 'monthly' | 'alltime')[] = ['daily', 'weekly', 'monthly', 'alltime'];

    for (const period of periods) {
        const periodKey = getCurrentPeriodKey(period);

        // Check existing entry
        const existing = await db
            .select()
            .from(leaderboardEntries)
            .where(
                and(
                    eq(leaderboardEntries.userId, userId),
                    eq(leaderboardEntries.gameId, gameId),
                    eq(leaderboardEntries.period, period),
                    eq(leaderboardEntries.periodKey, periodKey)
                )
            )
            .limit(1)
            .then(res => res[0]);

        if (existing) {
            // Only update if new score is higher
            if (score > existing.score) {
                await db
                    .update(leaderboardEntries)
                    .set({
                        score,
                        previousRank: existing.rank,
                        metadata: metadata ? JSON.stringify(metadata) : existing.metadata,
                        updatedAt: new Date(),
                    })
                    .where(eq(leaderboardEntries.id, existing.id));
            }
        } else {
            // Create new entry
            await db.insert(leaderboardEntries).values({
                id: crypto.randomUUID(),
                userId,
                gameId,
                score,
                period,
                periodKey,
                metadata: metadata ? JSON.stringify(metadata) : null,
            });
        }

        // Recalculate ranks for this leaderboard
        await recalculateRanks(gameId, period, periodKey);
    }

    // Also update combined leaderboard
    await updateCombinedLeaderboard(userId);
}

// Recalculate ranks for a leaderboard
async function recalculateRanks(gameId: string, period: string, periodKey: string) {
    // Get all entries sorted by score
    const entries = await db
        .select()
        .from(leaderboardEntries)
        .where(
            and(
                eq(leaderboardEntries.gameId, gameId),
                eq(leaderboardEntries.period, period),
                eq(leaderboardEntries.periodKey, periodKey)
            )
        )
        .orderBy(desc(leaderboardEntries.score));

    const totalPlayers = entries.length;

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
        const rank = i + 1;
        const percentile = ((totalPlayers - rank) / totalPlayers) * 100;

        await db
            .update(leaderboardEntries)
            .set({
                rank,
                percentile: Math.round(percentile * 10) / 10, // Round to 1 decimal
            })
            .where(eq(leaderboardEntries.id, entries[i].id));
    }
}

// Update combined (all games) leaderboard
async function updateCombinedLeaderboard(userId: string) {
    const periods: ('daily' | 'weekly' | 'monthly' | 'alltime')[] = ['daily', 'weekly', 'monthly', 'alltime'];

    for (const period of periods) {
        const periodKey = getCurrentPeriodKey(period);

        // Get user's total score across all games for this period
        const userScores = await db
            .select({ totalScore: sql<number>`SUM(${leaderboardEntries.score})` })
            .from(leaderboardEntries)
            .where(
                and(
                    eq(leaderboardEntries.userId, userId),
                    eq(leaderboardEntries.period, period),
                    eq(leaderboardEntries.periodKey, periodKey),
                    sql`${leaderboardEntries.gameId} != 'combined'`
                )
            )
            .limit(1)
            .then(res => res[0]);

        const totalScore = userScores?.totalScore || 0;

        if (totalScore > 0) {
            // Update or create combined entry
            const existing = await db
                .select()
                .from(leaderboardEntries)
                .where(
                    and(
                        eq(leaderboardEntries.userId, userId),
                        eq(leaderboardEntries.gameId, 'combined'),
                        eq(leaderboardEntries.period, period),
                        eq(leaderboardEntries.periodKey, periodKey)
                    )
                )
                .limit(1)
                .then(res => res[0]);

            if (existing) {
                await db
                    .update(leaderboardEntries)
                    .set({
                        score: totalScore,
                        previousRank: existing.rank,
                        updatedAt: new Date(),
                    })
                    .where(eq(leaderboardEntries.id, existing.id));
            } else {
                await db.insert(leaderboardEntries).values({
                    id: crypto.randomUUID(),
                    userId,
                    gameId: 'combined',
                    score: totalScore,
                    period,
                    periodKey,
                });
            }

            await recalculateRanks('combined', period, periodKey);
        }
    }
}

// Get global stats
export async function getGlobalStats() {
    let stats = await db.select().from(globalStats).where(eq(globalStats.id, 'global')).limit(1).then(res => res[0]);

    if (!stats) {
        await db.insert(globalStats).values({
            id: 'global',
            totalPlayers: 0,
            gamesPlayedToday: 0,
            gamesPlayedTotal: 0,
        });
        stats = await db.select().from(globalStats).where(eq(globalStats.id, 'global')).limit(1).then(res => res[0]);
    }

    return stats!;
}

// Increment global game count
export async function incrementGlobalGameCount() {
    const stats = await getGlobalStats();
    const today = new Date().toISOString().split('T')[0];
    const lastUpdateDate = stats.lastUpdated ? new Date(stats.lastUpdated).toISOString().split('T')[0] : null;

    await db
        .update(globalStats)
        .set({
            gamesPlayedTotal: stats.gamesPlayedTotal + 1,
            gamesPlayedToday: lastUpdateDate === today ? stats.gamesPlayedToday + 1 : 1,
            lastUpdated: new Date(),
        })
        .where(eq(globalStats.id, 'global'));
}

// Get top players for display
export async function getTopPlayersPreview(gameId: string = 'combined', limit: number = 5) {
    return getLeaderboard(gameId, 'alltime', limit);
}
