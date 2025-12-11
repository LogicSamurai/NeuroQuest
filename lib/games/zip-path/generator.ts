
export type Grid = number[][]; // 0 = empty, -1 = blocked

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

export function generateZipLevelData(date: string) {
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

            return {
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
        }
        attempts++;
    }

    throw new Error('Failed to generate valid Zip Path level after 100 attempts');
}
