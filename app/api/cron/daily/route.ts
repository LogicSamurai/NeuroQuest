import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameLevels, dailyPuzzles, userProgress } from '@/db/schema';
import { generateZipLevelData } from '@/lib/games/zip-path/generator';
import { eq, sql, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`Generating daily puzzles for ${today}...`);

        // Check if already generated
        const existing = await db.select().from(dailyPuzzles).where(eq(dailyPuzzles.date, today));

        // Check for extra levels
        const existingExtras = await db.select().from(gameLevels).where(and(
            eq(gameLevels.gameId, 'zip-path'),
            sql`DATE(${gameLevels.createdAt}) = ${today}`,
            sql`${gameLevels.name} LIKE 'Daily Extra%'`
        ));

        // Check for extra Alchemy levels
        const existingAlchemyExtras = await db.select().from(gameLevels).where(and(
            eq(gameLevels.gameId, 'alchemy-logic'),
            sql`DATE(${gameLevels.createdAt}) = ${today}`,
            sql`${gameLevels.name} LIKE 'Daily Extra%'`
        ));

        if (existing.length > 0 && existingExtras.length >= 5 && existingAlchemyExtras.length >= 5) {
            return NextResponse.json({ message: 'All daily content already exists for today.' });
        }

        // ... (Zip Path generation code remains same) ...

        // 3. Generate Alchemy Daily (Main)
        if (existing.length === 0) {
            console.log('Generating Alchemy daily...');
            const alchemyLevel = await generateAlchemyLevel(today);

            await db.insert(dailyPuzzles).values({
                date: today,
                gameId: 'alchemy-logic',
                levelId: alchemyLevel.id,
            });
        }

        // 3.1 Generate 5 Extra Daily Levels for Alchemy
        if (existingAlchemyExtras.length < 5) {
            console.log('Generating 5 extra Alchemy levels...');
            for (let i = 1; i <= 5; i++) {
                // We pass a unique suffix to generateAlchemyLevel to create unique IDs
                await generateAlchemyLevel(`${today}-extra-${i}`, `Daily Extra ${i}`);
            }
        }

        return NextResponse.json({ success: true, message: 'Daily puzzles generated successfully!' });

    } catch (error) {
        console.error('Failed to generate daily puzzles:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}

async function generateAlchemyLevel(dateSuffix: string, nameOverride?: string) {
    // 1. Get average user level for Alchemy
    const result = await db.select({ value: sql<number>`avg(${userProgress.levelReached})` })
        .from(userProgress)
        .where(eq(userProgress.gameId, 'alchemy-logic'));

    const avgLevel = Math.floor(result[0]?.value || 5); // Default to level 5 if no data

    // 2. Load levels.json
    const levelsPath = path.join(process.cwd(), 'public', 'games', 'alchemy', 'levels.json');
    let levels = [];

    try {
        const fileContent = fs.readFileSync(levelsPath, 'utf-8');
        levels = JSON.parse(fileContent);
    } catch (e) {
        console.error("Failed to read alchemy levels file:", e);
        // Fallback hardcoded levels if file read fails
        levels = [
            { id: 1, targetName: "Steam", targetId: "5" },
            { id: 2, targetName: "Rain", targetId: "6" },
            { id: 3, targetName: "Mud", targetId: "7" },
            { id: 4, targetName: "Energy", targetId: "8" },
            { id: 5, targetName: "Dust", targetId: "9" }
        ];
    }

    // 3. Pick a level around the average (e.g., +/- 10 levels for variety)
    const minLevel = Math.max(1, avgLevel - 10);
    const maxLevel = Math.min(levels.length, avgLevel + 10);

    // Filter levels in range
    const eligibleLevels = levels.filter((l: any) => l.id >= minLevel && l.id <= maxLevel);

    // Fallback if something is wrong
    const pool = eligibleLevels.length > 0 ? eligibleLevels : levels.slice(0, 20);

    // Pick random level from pool
    const targetLevel = pool[Math.floor(Math.random() * pool.length)];

    const levelData = {
        id: `daily-${dateSuffix}`,
        targetName: targetLevel.targetName,
        targetId: targetLevel.targetId,
        description: `Create ${targetLevel.targetName}`,
    };

    const [level] = await db.insert(gameLevels).values({
        gameId: 'alchemy-logic',
        name: nameOverride || `Daily ${targetLevel.targetName}`,
        difficulty: 'medium',
        data: JSON.stringify(levelData),
        isCampaign: false,
    }).returning();

    return level;
}
