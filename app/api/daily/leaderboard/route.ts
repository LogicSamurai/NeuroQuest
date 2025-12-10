
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyPuzzles, dailyPuzzleResults, users } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!gameId) {
        return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }

    try {
        // 1. Get the puzzle ID
        const puzzle = await db.query.dailyPuzzles.findFirst({
            where: and(
                eq(dailyPuzzles.date, date),
                eq(dailyPuzzles.gameId, gameId)
            )
        });

        if (!puzzle) {
            return NextResponse.json({ leaderboard: [] });
        }

        // 2. Get results
        // Sort by score DESC, then timeTaken ASC (faster is better)
        const results = await db.select({
            userId: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            image: users.image,
            score: dailyPuzzleResults.score,
            timeTaken: dailyPuzzleResults.timeTaken,
        })
            .from(dailyPuzzleResults)
            .innerJoin(users, eq(dailyPuzzleResults.userId, users.id))
            .where(eq(dailyPuzzleResults.puzzleId, puzzle.id))
            .orderBy(desc(dailyPuzzleResults.score), asc(dailyPuzzleResults.timeTaken))
            .limit(50);

        return NextResponse.json({ leaderboard: results });

    } catch (error) {
        console.error('Failed to fetch daily leaderboard:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
