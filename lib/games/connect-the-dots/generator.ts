
export interface Point {
    r: number;
    c: number;
}

export interface LevelNode {
    color: string;
    start: Point;
    end: Point;
}

export interface GeneratedLevel {
    id: number;
    width: number;
    height: number;
    nodes: LevelNode[];
    solution: number[][]; // For debugging or hints
}

const COLORS = ["RED", "BLUE", "GREEN", "YELLOW", "PURPLE", "ORANGE", "CYAN", "MAGENTA"];

export class LevelGenerator {
    private width: number;
    private height: number;
    private grid: number[][];
    private paths: Point[][];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill(null).map(() => Array(width).fill(0));
        this.paths = [];
    }

    generate(): GeneratedLevel | null {
        // Reset
        this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(0));
        this.paths = [];

        // Try to fill the grid
        // We start with color ID 1
        if (this.fillGrid(1)) {
            return this.createLevelFromGrid();
        }
        return null;
    }

    private fillGrid(colorId: number): boolean {
        // Find the first empty cell
        let startR = -1, startC = -1;
        let foundEmpty = false;

        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (this.grid[r][c] === 0) {
                    startR = r;
                    startC = c;
                    foundEmpty = true;
                    break;
                }
            }
            if (foundEmpty) break;
        }

        // If no empty cells, we are done!
        if (!foundEmpty) return true;

        // Start a path for this color
        // We need to try multiple random paths from this start point
        // But for simplicity in this backtracking, we just need to find ONE valid path that allows the REST of the grid to be filled.

        // Actually, the "Worm" logic says: pick a random empty cell. 
        // But to ensure we fill everything, picking the first available (top-left most) is a good heuristic to avoid leaving small holes behind.

        // However, we need to be able to backtrack if this color path leads to a dead end for FUTURE colors.

        // Let's try to grow a path from (startR, startC)
        // A path must be at least length 2 (start and end). Ideally >= 3.

        const path: Point[] = [{ r: startR, c: startC }];
        this.grid[startR][startC] = colorId;

        // We need to recursively extend this path until it gets stuck or we decide to stop.
        // Then we recurse to fillGrid(colorId + 1).

        // To make it robust, we can try to extend the path as much as possible, 
        // OR we can decide to stop at random points if length >= 3.

        return this.extendPath(path, colorId);
    }

    private extendPath(path: Point[], colorId: number): boolean {
        const current = path[path.length - 1];

        // Get valid neighbors
        const neighbors = [
            { r: current.r - 1, c: current.c },
            { r: current.r + 1, c: current.c },
            { r: current.r, c: current.c - 1 },
            { r: current.r, c: current.c + 1 }
        ].filter(p =>
            p.r >= 0 && p.r < this.height &&
            p.c >= 0 && p.c < this.width &&
            this.grid[p.r][p.c] === 0
        );

        // Shuffle neighbors for randomness
        for (let i = neighbors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
        }

        // Option 1: Try to extend the path further
        for (const next of neighbors) {
            this.grid[next.r][next.c] = colorId;
            path.push(next);

            if (this.extendPath(path, colorId)) {
                return true;
            }

            // Backtrack
            path.pop();
            this.grid[next.r][next.c] = 0;
        }

        // Option 2: If we can't extend (or randomly decide to stop), check if we can start the NEXT color
        // But we must ensure this path is long enough (>= 3 is good, >= 2 is absolute minimum)
        if (path.length >= 3) {
            // Save this path temporarily (in a real implementation we might not need to save it explicitly in the class yet)
            // Recurse for next color
            if (this.fillGrid(colorId + 1)) {
                this.paths[colorId - 1] = [...path]; // Store successful path (0-indexed)
                return true;
            }
        }

        return false;
    }

    private createLevelFromGrid(): GeneratedLevel {
        const nodes: LevelNode[] = [];

        // Extract start and end points for each color
        // Since we stored paths in order of colorId
        // paths[0] is colorId 1, etc.

        // Note: The recursive logic above populates `this.paths` in reverse order of completion stack?
        // No, `this.paths[colorId - 1] = ...` saves it when the recursive call returns true.

        this.paths.forEach((path, idx) => {
            if (!path) return;
            const color = COLORS[idx % COLORS.length];
            nodes.push({
                color,
                start: path[0],
                end: path[path.length - 1]
            });
        });

        return {
            id: Date.now(),
            width: this.width,
            height: this.height,
            nodes,
            solution: this.grid.map(row => [...row])
        };
    }
}
