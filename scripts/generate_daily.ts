
import { db } from '../lib/db';
import { gameLevels, dailyPuzzles } from '../db/schema';
import { findHamiltonianPath, Grid } from './fix_levels';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { eq, and } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function generateDaily() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Generating daily puzzles for ${today}...`);

    // Check if already generated
    const existing = await db.select().from(dailyPuzzles).where(eq(dailyPuzzles.date, today));
    if (existing.length > 0) {
        console.log('Daily puzzles already exist for today.');
        process.exit(0);
    }

    // 1. Generate Zip Path Daily
    console.log('Generating Zip Path daily...');
    const zipLevel = await generateZipLevel(today);
    await db.insert(dailyPuzzles).values({
        date: today,
        gameId: 'zip-path',
        levelId: zipLevel.id,
    });

    // 2. Generate Alchemy Daily
    console.log('Generating Alchemy daily...');
    const alchemyLevel = await generateAlchemyLevel(today);
    await db.insert(dailyPuzzles).values({
        date: today,
        gameId: 'alchemy-logic',
        levelId: alchemyLevel.id,
    });

    console.log('Daily puzzles generated successfully!');
    process.exit(0);
}

async function generateZipLevel(date: string) {
    const size = 5;
    let attempts = 0;
    while (attempts < 100) {
        const grid: Grid = Array(size).fill(0).map(() => Array(size).fill(0));
        const blocked: { row: number, col: number }[] = [];

        // Block random cells
        let blockAttempts = 0;
        while (blocked.length < 3 && blockAttempts < 100) {
            const r = Math.floor(Math.random() * size);
            const c = Math.floor(Math.random() * size);
            if (!blocked.some(b => b.row === r && b.col === c)) {
                blocked.push({ row: r, col: c });
                grid[r][c] = -1;
            }
            blockAttempts++;
        }

        const totalCells = size * size - blocked.length;
        const path: { row: number, col: number }[] = [];
        const visited = new Set<string>();

        // Try to find path
        // CRITICAL: This guarantees solvability.
        // We only proceed if findHamiltonianPath returns true, which means a valid path exists
        // visiting all non-blocked cells exactly once.
        let validPath = false;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] !== -1) {
                    if (findHamiltonianPath(grid, r, c, path, visited, totalCells)) {
                        validPath = true;
                        break;
                    }
                }
            }
            if (validPath) break;
        }

        if (validPath) {
            // Found it! Proceed to save
            // Distribute numbers (1 to 5)
            const numCount = 5;
            const numbers: Record<number, { row: number; col: number }> = {};
            numbers[1] = path[0];
            numbers[numCount] = path[path.length - 1];
            if (numCount > 2) {
                const step = (path.length - 1) / (numCount - 1);
                for (let i = 2; i < numCount; i++) {
                    const index = Math.round((i - 1) * step);
                    numbers[i] = path[index];
                }
            }

            const levelData = {
                id: `daily-${date}`,
                name: `Daily Challenge ${date}`,
                difficulty: 'medium',
                gridSize: size,
                numbers,
                blocked,
                pattern: {
                    colors: Array(size).fill(Array(size).fill('#FFFFFF')), // Default white
                    shapes: Array(size).fill(Array(size).fill('circle')),
                    name: `Daily ${date}`,
                    emoji: '📅',
                },
                timeTargets: {
                    gold: 30,
                    silver: 60,
                    bronze: 90,
                }
            };

            const [level] = await db.insert(gameLevels).values({
                gameId: 'zip-path',
                name: `Daily ${date}`,
                difficulty: 'medium',
                data: JSON.stringify(levelData),
                isCampaign: false,
            }).returning();

            return level;
        }
        attempts++;
    }

    throw new Error('Failed to generate valid Zip Path level after 100 attempts');
}

async function generateAlchemyLevel(date: string) {
    const alchemyPath = path.join(process.cwd(), 'public', 'games', 'alchemy', 'data.json');
    const data = JSON.parse(fs.readFileSync(alchemyPath, 'utf-8'));
    const elements = data.elements;

    // Pick random element ID > 20 (to avoid too easy ones)
    const eligible = elements.filter((e: any) => parseInt(e.id) > 20);
    const target = eligible[Math.floor(Math.random() * eligible.length)];

    const levelData = {
        id: `daily-${date}`,
        targetName: target.name,
        targetId: target.id,
        description: `Create ${target.name}`,
    };

    const [level] = await db.insert(gameLevels).values({
        gameId: 'alchemy-logic',
        name: `Daily ${target.name}`,
        difficulty: 'medium',
        data: JSON.stringify(levelData),
        isCampaign: false,
    }).returning();

    return level;
}

generateDaily().catch(console.error);
