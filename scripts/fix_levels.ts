
import { ALL_LEVELS, ZipLevel } from '../lib/games/zip-path/levels';

// Simple grid representation
export type Grid = number[][]; // 0 = empty, -1 = blocked

const UNSOLVABLE_IDS = [16, 17, 18, 19, 20];

function generateSolvableConfig(level: ZipLevel) {
    const size = level.gridSize;
    const grid: Grid = Array(size).fill(0).map(() => Array(size).fill(0));

    // Initialize blocked
    level.blocked.forEach(p => grid[p.row][p.col] = -1);

    const totalCells = size * size - level.blocked.length;
    const numCount = Object.keys(level.numbers).length;

    // Try to start at the original start position
    const startPos = level.numbers[1];

    console.log(`\nAttempting to fix Level ${level.id} (${level.name})...`);
    console.log(`Grid Size: ${size}x${size}, Blocked: ${level.blocked.length}, Target Path Length: ${totalCells}`);

    const path: { row: number, col: number }[] = [];
    const visited = new Set<string>();

    if (findHamiltonianPath(grid, startPos.row, startPos.col, path, visited, totalCells)) {
        printSolution(level, path, numCount);
    } else {
        console.log(`⚠️ Could not find path from original start. Searching for ANY valid path...`);
        // Try all other cells
        let found = false;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] !== -1 && (r !== startPos.row || c !== startPos.col)) {
                    const newPath: { row: number, col: number }[] = [];
                    const newVisited = new Set<string>();
                    if (findHamiltonianPath(grid, r, c, newPath, newVisited, totalCells)) {
                        console.log(`✅ Found valid path starting at (${r},${c})!`);
                        printSolution(level, newPath, numCount);
                        found = true;
                        break;
                    }
                }
            }
            if (found) break;
        }
        if (!found) {
            console.error(`❌ Level ${level.id} is truly UNSOLVABLE with current blocked cells.`);
        }
    }
}

function printSolution(level: ZipLevel, path: { row: number, col: number }[], numCount: number) {
    // Distribute numbers along the path
    const newNumbers: Record<number, { row: number; col: number }> = {};

    // Always 1 at start
    newNumbers[1] = path[0];

    // Always Max at end
    newNumbers[numCount] = path[path.length - 1];

    // Distribute others evenly
    if (numCount > 2) {
        const step = (path.length - 1) / (numCount - 1);
        for (let i = 2; i < numCount; i++) {
            const index = Math.round((i - 1) * step);
            newNumbers[i] = path[index];
        }
    }

    console.log("New Numbers Configuration:");
    console.log(JSON.stringify(newNumbers, null, 2));
}

export function findHamiltonianPath(
    grid: Grid,
    r: number,
    c: number,
    path: { row: number, col: number }[],
    visited: Set<string>,
    totalCells: number
): boolean {
    path.push({ row: r, col: c });
    visited.add(`${r},${c}`);

    if (path.length === totalCells) {
        return true;
    }

    // Heuristic: Try neighbors with fewest available moves first (Warnsdorff's rule)
    const neighbors = getNeighbors(grid, r, c, visited);
    neighbors.sort((a, b) => getDegree(grid, a.r, a.c, visited) - getDegree(grid, b.r, b.c, visited));

    for (const n of neighbors) {
        if (findHamiltonianPath(grid, n.r, n.c, path, visited, totalCells)) {
            return true;
        }
    }

    path.pop();
    visited.delete(`${r},${c}`);
    return false;
}

function getNeighbors(grid: Grid, r: number, c: number, visited: Set<string>) {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const neighbors = [];
    for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length && grid[nr][nc] !== -1 && !visited.has(`${nr},${nc}`)) {
            neighbors.push({ r: nr, c: nc });
        }
    }
    return neighbors;
}

function getDegree(grid: Grid, r: number, c: number, visited: Set<string>) {
    return getNeighbors(grid, r, c, visited).length;
}

async function fixAll() {
    for (const id of UNSOLVABLE_IDS) {
        const level = ALL_LEVELS.find(l => l.id === id);
        if (level) {
            generateSolvableConfig(level);
        }
    }
}

if (require.main === module) {
    fixAll();
}
