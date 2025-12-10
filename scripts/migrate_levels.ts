
import { db } from '../lib/db';
import { gameLevels } from '../db/schema';
import { ALL_LEVELS } from '../lib/games/zip-path/levels';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function migrate() {
    console.log('Starting migration...');

    // 1. Migrate Zip Path Levels
    console.log('Migrating Zip Path levels...');
    for (const level of ALL_LEVELS) {
        await db.insert(gameLevels).values({
            gameId: 'zip-path',
            name: level.name,
            difficulty: level.difficulty,
            data: JSON.stringify(level),
            isCampaign: true,
            orderIndex: level.id,
        });
        console.log(`Migrated Zip Level: ${level.name}`);
    }

    // 2. Migrate Alchemy Levels
    console.log('Migrating Alchemy levels...');
    const alchemyPath = path.join(process.cwd(), 'public', 'games', 'alchemy', 'levels.json');
    if (fs.existsSync(alchemyPath)) {
        const alchemyLevels = JSON.parse(fs.readFileSync(alchemyPath, 'utf-8'));
        for (const level of alchemyLevels) {
            await db.insert(gameLevels).values({
                gameId: 'alchemy-logic',
                name: level.targetName,
                difficulty: 'medium', // Default for now
                data: JSON.stringify(level),
                isCampaign: true,
                orderIndex: level.id,
            });
            console.log(`Migrated Alchemy Level: ${level.targetName}`);
        }
    } else {
        console.warn('Alchemy levels file not found!');
    }

    console.log('Migration complete!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
