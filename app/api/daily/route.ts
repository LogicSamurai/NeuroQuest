
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyPuzzles, gameLevels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

import { auth } from "@/auth";
import { dailyPuzzleResults } from "@/db/schema";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!gameId) {
        return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }

    try {
        const session = await auth();
        const userId = session?.user?.id;

        const result = await db.select({
            level: gameLevels,
            puzzleId: dailyPuzzles.id
        })
            .from(dailyPuzzles)
            .innerJoin(gameLevels, eq(dailyPuzzles.levelId, gameLevels.id))
            .where(and(
                eq(dailyPuzzles.date, date),
                eq(dailyPuzzles.gameId, gameId)
            ))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'No daily puzzle found' }, { status: 404 });
        }

        let completed = false;
        if (userId) {
            const completion = await db.select()
                .from(dailyPuzzleResults)
                .where(and(
                    eq(dailyPuzzleResults.userId, userId),
                    eq(dailyPuzzleResults.puzzleId, result[0].puzzleId)
                ))
                .limit(1);

            completed = completion.length > 0;
        }

        const levelData = JSON.parse(result[0].level.data);
        return NextResponse.json({ ...levelData, completed });

    } catch (error) {
        console.error('Failed to fetch daily puzzle:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
