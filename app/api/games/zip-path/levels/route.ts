import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameLevels } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch levels generated today that are NOT campaign levels
        // We filter by name starting with "Daily Extra" to be specific
        const levels = await db.select()
            .from(gameLevels)
            .where(and(
                eq(gameLevels.gameId, 'zip-path'),
                eq(gameLevels.isCampaign, false),
                sql`DATE(${gameLevels.createdAt}) = ${today}`,
                sql`${gameLevels.name} LIKE 'Daily Extra%'`
            ));

        return NextResponse.json({ levels });
    } catch (error) {
        console.error('Failed to fetch daily levels:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
