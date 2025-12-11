import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameLevels, dailyPuzzles, userProgress } from '@/db/schema';
import { generateZipLevelData } from '@/lib/games/zip-path/generator';
import { eq, sql } from 'drizzle-orm';
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
        if (existing.length > 0) {
            return NextResponse.json({ message: 'Daily puzzles already exist for today.' });
        }

        // 2. Generate Zip Path Daily
        console.log('Generating Zip Path daily...');
        const zipLevelData = generateZipLevelData(today);

        const [zipLevel] = await db.insert(gameLevels).values({
            gameId: 'zip-path',
            name: `Daily ${today}`,
            difficulty: 'medium',
            data: JSON.stringify(zipLevelData),
            isCampaign: false,
        }).returning();

        await db.insert(dailyPuzzles).values({
            date: today,
            gameId: 'zip-path',
            levelId: zipLevel.id,
        });

        // 3. Generate Alchemy Daily
        console.log('Generating Alchemy daily...');
        const alchemyLevel = await generateAlchemyLevel(today);

        await db.insert(dailyPuzzles).values({
            date: today,
            gameId: 'alchemy-logic',
            levelId: alchemyLevel.id,
        });

        return NextResponse.json({ success: true, message: 'Daily puzzles generated successfully!' });

    } catch (error) {
        console.error('Failed to generate daily puzzles:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}

async function generateAlchemyLevel(date: string) {
    // 1. Get average user level for Alchemy
    const result = await db.select({ value: sql<number>`avg(${userProgress.levelReached})` })
        .from(userProgress)
        .where(eq(userProgress.gameId, 'alchemy-logic'));

    const avgLevel = Math.floor(result[0]?.value || 5); // Default to level 5 if no data

    // 2. Load levels.json
    // In Vercel serverless, we need to be careful with paths.
    // process.cwd() is the root of the project.
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

    // 3. Pick a level around the average (e.g., +/- 5 levels)
    const minLevel = Math.max(1, avgLevel - 5);
    const maxLevel = Math.min(levels.length, avgLevel + 5);

    // Filter levels in range
    const eligibleLevels = levels.filter((l: any) => l.id >= minLevel && l.id <= maxLevel);

    // Fallback if something is wrong
    const pool = eligibleLevels.length > 0 ? eligibleLevels : levels.slice(0, 10);

    // Pick random level from pool
    const targetLevel = pool[Math.floor(Math.random() * pool.length)];

    const levelData = {
        id: `daily-${date}`,
        targetName: targetLevel.targetName,
        targetId: targetLevel.targetId,
        description: `Create ${targetLevel.targetName}`,
    };

    const [level] = await db.insert(gameLevels).values({
        gameId: 'alchemy-logic',
        name: `Daily ${targetLevel.targetName}`,
        difficulty: 'medium',
        data: JSON.stringify(levelData),
        isCampaign: false,
    }).returning();

    return level;
}
