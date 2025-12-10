
import { ZipLevel } from "./levels";

type Grid = number[][]; // 0 = empty, -1 = blocked

export function solveZipLevel(level: ZipLevel, currentPath: { row: number, col: number }[] = []): { row: number, col: number }[] | null {
    const size = level.gridSize;
    const grid: Grid = Array(size).fill(0).map(() => Array(size).fill(0));

    // Initialize blocked
    level.blocked.forEach(p => grid[p.row][p.col] = -1);

    // Initialize numbers
    const numCount = Object.keys(level.numbers).length;
    const maxNumber = Math.max(...Object.keys(level.numbers).map(Number));

    // Mark numbers on grid for easy lookup
    const numberMap = new Map<string, number>();
    Object.entries(level.numbers).forEach(([num, pos]) => {
        numberMap.set(`${pos.row},${pos.col}`, parseInt(num));
    });

    const totalCells = size * size - level.blocked.length;

    // If no path started, start at 1
    let path = [...currentPath];
    if (path.length === 0) {
        const start = level.numbers[1];
        path.push(start);
    }

    const visited = new Set<string>();
    path.forEach(p => visited.add(`${p.row},${p.col}`));

    // Current number we are at
    // We need to determine what the "current" number index is based on the path length?
    // No, the path itself determines position. We need to know what the *next* expected number is.
    // Actually, we can just validate the path as we go.

    // We need to pass the *target* number we are aiming for next, or just check constraints.
    // Let's use a recursive solver that respects the fixed numbers.

    const solution = findPath(grid, path, visited, totalCells, numberMap, maxNumber);
    return solution;
}

function findPath(
    grid: Grid,
    path: { row: number, col: number }[],
    visited: Set<string>,
    totalCells: number,
    numberMap: Map<string, number>,
    maxNumber: number
): { row: number, col: number }[] | null {
    const current = path[path.length - 1];

    // Check if we reached the end
    if (path.length === totalCells) {
        // Must be at max number
        if (numberMap.get(`${current.row},${current.col}`) === maxNumber) {
            return path;
        }
        return null;
    }

    // If we are at a number, check if it's the correct one for this path length?
    // No, numbers are fixed at specific coordinates.
    // If we step ONTO a number, we must verify it's the *next* sequential number.
    // But since we are generating the path, we just need to ensure we don't violate order.

    // Actually, simpler:
    // When we move to a neighbor:
    // 1. If neighbor is a number: It MUST be (current_number_count + 1)
    // 2. If neighbor is NOT a number: It's fine, as long as we haven't skipped a number.

    // We need to track "last seen number".
    // Let's re-evaluate the state.

    const currentNum = getLastSeenNumber(path, numberMap);

    const neighbors = getNeighbors(grid, current.row, current.col, visited);

    // Heuristic: Sort by degree (Warnsdorff's rule) to speed up
    neighbors.sort((a, b) => getDegree(grid, a.row, a.col, visited) - getDegree(grid, b.row, b.col, visited));

    for (const next of neighbors) {
        const nextKey = `${next.row},${next.col}`;
        const nextNumVal = numberMap.get(nextKey);

        // Constraint: If next is a number, it must be currentNum + 1
        if (nextNumVal !== undefined) {
            if (nextNumVal !== currentNum + 1) continue;
        }

        // Constraint: We cannot step on a number if we haven't reached it sequentially?
        // The above check handles "stepping on wrong number".
        // But what if we step on an empty cell that "blocks" access to the next number?
        // The backtracking will handle that (eventually returns null).

        // Optimization: If we are NOT stepping on a number, but the *next* number is reachable, good.
        // If we are wandering too far from the next number?

        path.push(next);
        visited.add(nextKey);

        const res = findPath(grid, path, visited, totalCells, numberMap, maxNumber);
        if (res) return res;

        visited.delete(nextKey);
        path.pop();
    }

    return null;
}

function getLastSeenNumber(path: { row: number, col: number }[], numberMap: Map<string, number>): number {
    // Iterate backwards to find the last number
    for (let i = path.length - 1; i >= 0; i--) {
        const p = path[i];
        const num = numberMap.get(`${p.row},${p.col}`);
        if (num !== undefined) return num;
    }
    return 1; // Should always start with 1
}

function getNeighbors(grid: Grid, r: number, c: number, visited: Set<string>) {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const neighbors = [];
    for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length && grid[nr][nc] !== -1 && !visited.has(`${nr},${nc}`)) {
            neighbors.push({ row: nr, col: nc });
        }
    }
    return neighbors;
}

function getDegree(grid: Grid, r: number, c: number, visited: Set<string>) {
    return getNeighbors(grid, r, c, visited).length;
}
