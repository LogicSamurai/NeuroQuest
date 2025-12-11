
import { ALL_LEVELS, ZipLevel } from '../lib/games/zip-path/levels';

// Simple grid representation
type Grid = number[][]; // 0 = empty, -1 = blocked, >0 = number

function solveLevel(level: ZipLevel): boolean {
    const size = level.gridSize;
    const grid: Grid = Array(size).fill(0).map(() => Array(size).fill(0));

    // Initialize grid
    level.blocked.forEach(p => grid[p.row][p.col] = -1);
    Object.entries(level.numbers).forEach(([num, p]) => {
        grid[p.row][p.col] = parseInt(num);
    });

    const totalCells = size * size - level.blocked.length;
    const maxNumber = Math.max(...Object.keys(level.numbers).map(Number));
    const startPos = level.numbers[1];

    // Visited set (using coordinates string "r,c")
    const visited = new Set<string>();
    visited.add(`${startPos.row},${startPos.col}`);

    // Find path
    return findPath(grid, startPos.row, startPos.col, 1, visited, totalCells, maxNumber, level.numbers);
}

function findPath(
    grid: Grid,
    r: number,
    c: number,
    currentNum: number,
    visited: Set<string>,
    totalCells: number,
    maxNumber: number,
    numbers: Record<number, { row: number; col: number }>
): boolean {
    // Check if we reached the end condition
    if (visited.size === totalCells) {
        // Must be at max number
        if (grid[r][c] === maxNumber) {
            return true;
        }
        return false;
    }

    // If we reached max number but haven't visited all cells, this path is invalid
    if (grid[r][c] === maxNumber) {
        return false;
    }

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;

        // Bounds check
        if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) continue;

        // Blocked check
        if (grid[nr][nc] === -1) continue;

        // Visited check
        if (visited.has(`${nr},${nc}`)) continue;

        // Number logic check
        const cellNum = grid[nr][nc];
        let nextNum = currentNum;

        if (cellNum > 0) {
            // If it's a number, it MUST be currentNum + 1
            if (cellNum !== currentNum + 1) continue;
            nextNum = cellNum;
        }

        // Backtracking
        visited.add(`${nr},${nc}`);
        if (findPath(grid, nr, nc, nextNum, visited, totalCells, maxNumber, numbers)) {
            return true;
        }
        visited.delete(`${nr},${nc}`);
    }

    return false;
}

async function verifyAll() {
    console.log("Verifying all levels...");
    const failedLevels: number[] = [];

    for (const level of ALL_LEVELS) {
        console.log(`Checking Level ${level.id}: ${level.name}...`);
        try {
            const solvable = solveLevel(level);
            if (solvable) {
                console.log(`✅ Level ${level.id} is solvable.`);
            } else {
                console.error(`❌ Level ${level.id} is UNSOLVABLE.`);
                failedLevels.push(level.id);
            }
        } catch (e) {
            console.error(`Error checking Level ${level.id}:`, e);
            failedLevels.push(level.id);
        }
    }

    if (failedLevels.length > 0) {
        console.error("\nSummary: The following levels are unsolvable:");
        console.error(failedLevels.join(", "));
        process.exit(1);
    } else {
        console.log("\nAll levels are solvable! 🎉");
        process.exit(0);
    }
}

verifyAll();
