import { db } from "@/lib/db";
import { dailyPuzzleResults, dailyPuzzles, users } from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export async function getDailyLeaderboard(gameId: string | null, date: string, limit: number = 100) {
    const query = db
        .select({
            id: dailyPuzzleResults.id,
            userId: users.id,
            userName: users.name,
            userAvatar: users.image,
            userLevel: users.level,
            score: dailyPuzzleResults.score,
            timeTaken: dailyPuzzleResults.timeTaken,
            gameId: dailyPuzzles.gameId,
            completedAt: dailyPuzzleResults.completedAt,
        })
        .from(dailyPuzzleResults)
        .innerJoin(dailyPuzzles, eq(dailyPuzzleResults.puzzleId, dailyPuzzles.id))
        .innerJoin(users, eq(dailyPuzzleResults.userId, users.id))
        .where(and(
            eq(dailyPuzzles.date, date),
            gameId && gameId !== 'combined' ? eq(dailyPuzzles.gameId, gameId) : undefined
        ))
        .orderBy(desc(dailyPuzzleResults.score), asc(dailyPuzzleResults.timeTaken))
        .limit(limit);

    const results = await query;

    // Add rank
    return results.map((entry, index) => ({
        ...entry,
        rank: index + 1,
    }));
}

export async function getUserDailyRank(userId: string, gameId: string | null, date: string) {
    // This is a bit more complex to get exact rank efficiently without window functions in simple query
    // For now, we can fetch all (or top N) and find the user, or use a count query.
    // Using window function is better but requires raw SQL or advanced Drizzle usage.

    // Let's stick to a simpler approach: Get the user's result first.
    const userResult = await db
        .select({
            score: dailyPuzzleResults.score,
            timeTaken: dailyPuzzleResults.timeTaken,
            gameId: dailyPuzzles.gameId,
        })
        .from(dailyPuzzleResults)
        .innerJoin(dailyPuzzles, eq(dailyPuzzleResults.puzzleId, dailyPuzzles.id))
        .where(and(
            eq(dailyPuzzleResults.userId, userId),
            eq(dailyPuzzles.date, date),
            gameId && gameId !== 'combined' ? eq(dailyPuzzles.gameId, gameId) : undefined
        ))
        .limit(1);

    if (userResult.length === 0) return null;

    const { score, timeTaken } = userResult[0];

    // Count how many people have better score, or same score and better time
    const betterCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(dailyPuzzleResults)
        .innerJoin(dailyPuzzles, eq(dailyPuzzleResults.puzzleId, dailyPuzzles.id))
        .where(and(
            eq(dailyPuzzles.date, date),
            gameId && gameId !== 'combined' ? eq(dailyPuzzles.gameId, gameId) : undefined,
            sql`(${dailyPuzzleResults.score} > ${score} OR (${dailyPuzzleResults.score} = ${score} AND ${dailyPuzzleResults.timeTaken} < ${timeTaken}))`
        ));

    const rank = Number(betterCount[0].count) + 1;

    // Get total players
    const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(dailyPuzzleResults)
        .innerJoin(dailyPuzzles, eq(dailyPuzzleResults.puzzleId, dailyPuzzles.id))
        .where(and(
            eq(dailyPuzzles.date, date),
            gameId && gameId !== 'combined' ? eq(dailyPuzzles.gameId, gameId) : undefined
        ));

    return {
        rank,
        score,
        timeTaken,
        totalPlayers: Number(totalCount[0].count),
        percentile: (Number(totalCount[0].count) - rank) / Number(totalCount[0].count) * 100
    };
}
