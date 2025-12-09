// Zip Path Puzzle Levels
// Each level has numbers to connect in order while filling all cells
// Pattern reveals on completion

export interface ZipLevel {
    id: number;
    name: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    gridSize: number;
    // Numbers positions: key is the number (1, 2, 3...), value is {row, col}
    numbers: Record<number, { row: number; col: number }>;
    // Blocked cells that cannot be crossed
    blocked: { row: number; col: number }[];
    // One-way cells (optional twist)
    oneWay?: { row: number; col: number; direction: 'up' | 'down' | 'left' | 'right' }[];
    // Pattern to reveal on completion - each cell maps to a color
    pattern: {
        colors: string[][]; // Grid of hex colors
        name: string; // Pattern name shown after completion
        emoji?: string; // Optional emoji to show
    };
    // Time targets for scoring
    timeTargets: {
        gold: number;   // seconds for 3 stars
        silver: number; // seconds for 2 stars
        bronze: number; // seconds for 1 star
    };
}

// Beautiful color palettes for patterns
const PALETTES = {
    sunset: ['#FF6B6B', '#FFA07A', '#FFD93D', '#FF8C00', '#FF4500'],
    ocean: ['#0077B6', '#00B4D8', '#48CAE4', '#90E0EF', '#CAF0F8'],
    forest: ['#2D5016', '#4A7C23', '#6B8E23', '#98BF64', '#C5E063'],
    candy: ['#FF69B4', '#FFB6C1', '#DDA0DD', '#E6E6FA', '#FFC0CB'],
    night: ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#E94560'],
    rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
};

// =====================================================
// EASY LEVELS (4x4 grid, 3-4 numbers, no obstacles)
// =====================================================

const EASY_LEVELS: ZipLevel[] = [
    {
        id: 1,
        name: "First Steps",
        difficulty: 'easy',
        gridSize: 4,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 0, col: 3 },
            3: { row: 3, col: 3 },
            4: { row: 3, col: 0 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#FFD93D', '#FFD93D', '#FFD93D', '#FFD93D'],
                ['#FFD93D', '#000000', '#000000', '#FFD93D'],
                ['#FFD93D', '#000000', '#000000', '#FFD93D'],
                ['#FFD93D', '#FFD93D', '#FFD93D', '#FFD93D'],
            ],
            name: "Sunny Square",
            emoji: "☀️"
        },
        timeTargets: { gold: 10, silver: 20, bronze: 30 }
    },
    {
        id: 2,
        name: "Heart",
        difficulty: 'easy',
        gridSize: 4,
        numbers: {
            1: { row: 0, col: 1 },
            2: { row: 1, col: 3 },
            3: { row: 3, col: 1 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#1A1A2E', '#FF69B4', '#FF69B4', '#1A1A2E'],
                ['#FF69B4', '#FF69B4', '#FF69B4', '#FF69B4'],
                ['#FF69B4', '#FF69B4', '#FF69B4', '#FF69B4'],
                ['#1A1A2E', '#FF69B4', '#FF69B4', '#1A1A2E'],
            ],
            name: "Love Heart",
            emoji: "❤️"
        },
        timeTargets: { gold: 12, silver: 20, bronze: 30 }
    },
    {
        id: 3,
        name: "Star",
        difficulty: 'easy',
        gridSize: 4,
        numbers: {
            1: { row: 0, col: 1 },
            2: { row: 0, col: 2 },
            3: { row: 3, col: 2 },
            4: { row: 3, col: 3 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#1A1A2E', '#FFD700', '#FFD700', '#1A1A2E'],
                ['#FFD700', '#FFD700', '#FFD700', '#FFD700'],
                ['#FFD700', '#FFD700', '#FFD700', '#FFD700'],
                ['#1A1A2E', '#FFD700', '#FFD700', '#1A1A2E'],
            ],
            name: "Golden Star",
            emoji: "⭐"
        },
        timeTargets: { gold: 12, silver: 22, bronze: 35 }
    },
    {
        id: 4,
        name: "Moon",
        difficulty: 'easy',
        gridSize: 4,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 1, col: 2 },
            3: { row: 3, col: 0 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#16213E', '#16213E', '#F5F5DC', '#F5F5DC'],
                ['#16213E', '#F5F5DC', '#F5F5DC', '#16213E'],
                ['#16213E', '#F5F5DC', '#F5F5DC', '#16213E'],
                ['#16213E', '#16213E', '#F5F5DC', '#F5F5DC'],
            ],
            name: "Crescent Moon",
            emoji: "🌙"
        },
        timeTargets: { gold: 10, silver: 18, bronze: 28 }
    },
    {
        id: 5,
        name: "Diamond",
        difficulty: 'easy',
        gridSize: 4,
        numbers: {
            1: { row: 0, col: 1 },
            2: { row: 2, col: 3 },
            3: { row: 3, col: 3 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#87CEEB', '#48CAE4', '#48CAE4', '#87CEEB'],
                ['#48CAE4', '#00CED1', '#00CED1', '#48CAE4'],
                ['#48CAE4', '#00CED1', '#00CED1', '#48CAE4'],
                ['#87CEEB', '#48CAE4', '#48CAE4', '#87CEEB'],
            ],
            name: "Blue Diamond",
            emoji: "💎"
        },
        timeTargets: { gold: 10, silver: 18, bronze: 28 }
    },
];

// =====================================================
// MEDIUM LEVELS (5x5 grid, 4-6 numbers, some obstacles)
// =====================================================

const MEDIUM_LEVELS: ZipLevel[] = [
    {
        id: 6,
        name: "Flower",
        difficulty: 'medium',
        gridSize: 5,
        numbers: {
            1: { row: 0, col: 2 },
            2: { row: 2, col: 0 },
            3: { row: 2, col: 4 },
            4: { row: 4, col: 2 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#98BF64', '#FF69B4', '#FF69B4', '#FF69B4', '#98BF64'],
                ['#FF69B4', '#FF69B4', '#FFD700', '#FF69B4', '#FF69B4'],
                ['#FF69B4', '#FFD700', '#FFD700', '#FFD700', '#FF69B4'],
                ['#FF69B4', '#FF69B4', '#FFD700', '#FF69B4', '#FF69B4'],
                ['#98BF64', '#FF69B4', '#4A7C23', '#FF69B4', '#98BF64'],
            ],
            name: "Spring Flower",
            emoji: "🌸"
        },
        timeTargets: { gold: 20, silver: 35, bronze: 50 }
    },
    {
        id: 7,
        name: "Tree",
        difficulty: 'medium',
        gridSize: 5,
        numbers: {
            1: { row: 0, col: 2 },
            2: { row: 2, col: 0 },
            3: { row: 2, col: 4 },
            4: { row: 4, col: 0 },
            5: { row: 4, col: 4 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#87CEEB', '#87CEEB', '#228B22', '#87CEEB', '#87CEEB'],
                ['#87CEEB', '#228B22', '#228B22', '#228B22', '#87CEEB'],
                ['#228B22', '#228B22', '#228B22', '#228B22', '#228B22'],
                ['#87CEEB', '#87CEEB', '#8B4513', '#87CEEB', '#87CEEB'],
                ['#87CEEB', '#87CEEB', '#8B4513', '#87CEEB', '#87CEEB'],
            ],
            name: "Pine Tree",
            emoji: "🌲"
        },
        timeTargets: { gold: 25, silver: 40, bronze: 60 }
    },
    {
        id: 8,
        name: "House",
        difficulty: 'medium',
        gridSize: 5,
        numbers: {
            1: { row: 0, col: 2 },
            2: { row: 3, col: 1 },
            3: { row: 2, col: 3 },
        },
        blocked: [{ row: 0, col: 0 }],
        pattern: {
            colors: [
                ['#87CEEB', '#87CEEB', '#A0522D', '#87CEEB', '#87CEEB'],
                ['#87CEEB', '#A0522D', '#A0522D', '#A0522D', '#87CEEB'],
                ['#FFE4B5', '#FFE4B5', '#FFE4B5', '#FFE4B5', '#FFE4B5'],
                ['#FFE4B5', '#87CEEB', '#87CEEB', '#87CEEB', '#FFE4B5'],
                ['#FFE4B5', '#FFE4B5', '#A0522D', '#FFE4B5', '#FFE4B5'],
            ],
            name: "Cozy House",
            emoji: "🏠"
        },
        timeTargets: { gold: 25, silver: 40, bronze: 55 }
    },
    {
        id: 9,
        name: "Butterfly",
        difficulty: 'medium',
        gridSize: 5,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 0, col: 4 },
            3: { row: 4, col: 0 },
            4: { row: 4, col: 4 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#9370DB', '#9370DB', '#1A1A2E', '#FF69B4', '#FF69B4'],
                ['#9370DB', '#DDA0DD', '#1A1A2E', '#FFB6C1', '#FF69B4'],
                ['#9370DB', '#DDA0DD', '#1A1A2E', '#FFB6C1', '#FF69B4'],
                ['#9370DB', '#DDA0DD', '#1A1A2E', '#FFB6C1', '#FF69B4'],
                ['#9370DB', '#9370DB', '#1A1A2E', '#FF69B4', '#FF69B4'],
            ],
            name: "Butterfly",
            emoji: "🦋"
        },
        timeTargets: { gold: 22, silver: 38, bronze: 55 }
    },
    {
        id: 10,
        name: "Rainbow",
        difficulty: 'medium',
        gridSize: 5,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 0, col: 4 },
            3: { row: 4, col: 2 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#FF0000', '#FF0000', '#FF0000', '#FF0000', '#FF0000'],
                ['#FF7F00', '#FF7F00', '#FF7F00', '#FF7F00', '#FF7F00'],
                ['#FFFF00', '#FFFF00', '#FFFF00', '#FFFF00', '#FFFF00'],
                ['#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00'],
                ['#0000FF', '#0000FF', '#0000FF', '#0000FF', '#0000FF'],
            ],
            name: "Rainbow",
            emoji: "🌈"
        },
        timeTargets: { gold: 18, silver: 32, bronze: 48 }
    },
];

// =====================================================
// HARD LEVELS (6x6 grid, 5-8 numbers, obstacles)
// =====================================================

const HARD_LEVELS: ZipLevel[] = [
    {
        id: 11,
        name: "Sunset",
        difficulty: 'hard',
        gridSize: 6,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 0, col: 5 },
            3: { row: 3, col: 3 },
            4: { row: 5, col: 1 },
            5: { row: 5, col: 4 },
        },
        blocked: [{ row: 2, col: 2 }, { row: 2, col: 3 }],
        pattern: {
            colors: [
                ['#FF6B6B', '#FF6B6B', '#FFA07A', '#FFA07A', '#FFD93D', '#FFD93D'],
                ['#FF6B6B', '#FFA07A', '#FFA07A', '#FFD93D', '#FFD93D', '#FFD93D'],
                ['#FFA07A', '#FFA07A', '#FFD93D', '#FFD93D', '#FF8C00', '#FF8C00'],
                ['#0077B6', '#0077B6', '#0077B6', '#0077B6', '#0077B6', '#0077B6'],
                ['#00B4D8', '#00B4D8', '#00B4D8', '#00B4D8', '#00B4D8', '#00B4D8'],
                ['#48CAE4', '#48CAE4', '#48CAE4', '#48CAE4', '#48CAE4', '#48CAE4'],
            ],
            name: "Ocean Sunset",
            emoji: "🌅"
        },
        timeTargets: { gold: 35, silver: 55, bronze: 80 }
    },
    {
        id: 12,
        name: "Mountain",
        difficulty: 'hard',
        gridSize: 6,
        numbers: {
            1: { row: 0, col: 2 },
            2: { row: 0, col: 3 },
            3: { row: 3, col: 0 },
            4: { row: 3, col: 5 },
            5: { row: 5, col: 1 },
            6: { row: 5, col: 4 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#87CEEB', '#87CEEB', '#FFFFFF', '#FFFFFF', '#87CEEB', '#87CEEB'],
                ['#87CEEB', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#87CEEB'],
                ['#87CEEB', '#808080', '#808080', '#808080', '#808080', '#87CEEB'],
                ['#808080', '#808080', '#808080', '#808080', '#808080', '#808080'],
                ['#228B22', '#228B22', '#228B22', '#228B22', '#228B22', '#228B22'],
                ['#228B22', '#8B4513', '#228B22', '#228B22', '#8B4513', '#228B22'],
            ],
            name: "Snowy Mountain",
            emoji: "🏔️"
        },
        timeTargets: { gold: 40, silver: 60, bronze: 90 }
    },
    {
        id: 13,
        name: "Cat Face",
        difficulty: 'hard',
        gridSize: 6,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 1, col: 4 },
            3: { row: 2, col: 3 },
            4: { row: 2, col: 0 },
            5: { row: 4, col: 2 },
            6: { row: 5, col: 4 },
        },
        blocked: [{ row: 1, col: 2 }, { row: 1, col: 3 }],
        pattern: {
            colors: [
                ['#FFA500', '#FFA500', '#FFA500', '#FFA500', '#FFA500', '#FFA500'],
                ['#FFA500', '#FFFFFF', '#FFA500', '#FFA500', '#FFFFFF', '#FFA500'],
                ['#FFA500', '#000000', '#FFA500', '#FFA500', '#000000', '#FFA500'],
                ['#FFA500', '#FFA500', '#FF69B4', '#FF69B4', '#FFA500', '#FFA500'],
                ['#FFA500', '#FFA500', '#FFA500', '#FFA500', '#FFA500', '#FFA500'],
                ['#FFA500', '#FFA500', '#FFA500', '#FFA500', '#FFA500', '#FFA500'],
            ],
            name: "Cat",
            emoji: "🐱"
        },
        timeTargets: { gold: 38, silver: 58, bronze: 85 }
    },
    {
        id: 14,
        name: "Rocket",
        difficulty: 'hard',
        gridSize: 6,
        numbers: {
            1: { row: 0, col: 2 },
            2: { row: 0, col: 3 },
            3: { row: 2, col: 1 },
            4: { row: 2, col: 4 },
            5: { row: 5, col: 1 },
            6: { row: 5, col: 4 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#1A1A2E', '#1A1A2E', '#FF0000', '#FF0000', '#1A1A2E', '#1A1A2E'],
                ['#1A1A2E', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#1A1A2E'],
                ['#1A1A2E', '#C0C0C0', '#0000FF', '#0000FF', '#C0C0C0', '#1A1A2E'],
                ['#1A1A2E', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#1A1A2E'],
                ['#1A1A2E', '#FF4500', '#C0C0C0', '#C0C0C0', '#FF4500', '#1A1A2E'],
                ['#1A1A2E', '#FF4500', '#FFD700', '#FFD700', '#FF4500', '#1A1A2E'],
            ],
            name: "Rocket Ship",
            emoji: "🚀"
        },
        timeTargets: { gold: 42, silver: 65, bronze: 95 }
    },
    {
        id: 15,
        name: "Cake",
        difficulty: 'hard',
        gridSize: 6,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 2, col: 1 },
            3: { row: 2, col: 3 },
            4: { row: 4, col: 0 },
            5: { row: 5, col: 5 },
            6: { row: 0, col: 5 },
        },
        blocked: [{ row: 1, col: 0 }, { row: 1, col: 5 }],
        pattern: {
            colors: [
                ['#FFE4B5', '#FFE4B5', '#FF0000', '#FF0000', '#FFE4B5', '#FFE4B5'],
                ['#FFE4B5', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFE4B5'],
                ['#FF69B4', '#FF69B4', '#FF69B4', '#FF69B4', '#FF69B4', '#FF69B4'],
                ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
                ['#FFB6C1', '#FFB6C1', '#FFB6C1', '#FFB6C1', '#FFB6C1', '#FFB6C1'],
                ['#8B4513', '#8B4513', '#8B4513', '#8B4513', '#8B4513', '#8B4513'],
            ],
            name: "Birthday Cake",
            emoji: "🎂"
        },
        timeTargets: { gold: 45, silver: 70, bronze: 100 }
    },
];

// =====================================================
// EXPERT LEVELS (7x7 grid, complex obstacles)
// =====================================================

const EXPERT_LEVELS: ZipLevel[] = [
    {
        id: 16,
        name: "Galaxy",
        difficulty: 'expert',
        gridSize: 7,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 1, col: 5 },
            3: { row: 2, col: 2 },
            4: { row: 3, col: 3 },
            5: { row: 4, col: 4 },
            6: { row: 5, col: 1 },
            7: { row: 6, col: 6 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#0F0F23', '#0F0F23', '#FFFFFF', '#FFD700', '#FFFFFF', '#0F0F23', '#0F0F23'],
                ['#0F0F23', '#FFFFFF', '#0F0F23', '#0F0F23', '#0F0F23', '#FFFFFF', '#0F0F23'],
                ['#FFFFFF', '#0F0F23', '#9370DB', '#9370DB', '#9370DB', '#0F0F23', '#FFFFFF'],
                ['#0F0F23', '#0F0F23', '#9370DB', '#FFD700', '#9370DB', '#0F0F23', '#0F0F23'],
                ['#FFFFFF', '#0F0F23', '#9370DB', '#9370DB', '#9370DB', '#0F0F23', '#FFFFFF'],
                ['#0F0F23', '#FFFFFF', '#0F0F23', '#0F0F23', '#0F0F23', '#FFFFFF', '#0F0F23'],
                ['#0F0F23', '#0F0F23', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#0F0F23', '#0F0F23'],
            ],
            name: "Spiral Galaxy",
            emoji: "🌌"
        },
        timeTargets: { gold: 60, silver: 90, bronze: 130 }
    },
    {
        id: 17,
        name: "Panda",
        difficulty: 'expert',
        gridSize: 7,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 1, col: 1 },
            3: { row: 3, col: 3 },
            4: { row: 5, col: 5 },
            5: { row: 6, col: 6 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#000000', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#000000'],
                ['#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#000000', '#FFFFFF'],
                ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
                ['#FFFFFF', '#FFFFFF', '#000000', '#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF'],
                ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
                ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
                ['#000000', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#000000'],
            ],
            name: "Panda Face",
            emoji: "🐼"
        },
        timeTargets: { gold: 55, silver: 85, bronze: 120 }
    },
    {
        id: 18,
        name: "Cactus",
        difficulty: 'expert',
        gridSize: 7,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 1, col: 5 },
            3: { row: 2, col: 2 },
            4: { row: 3, col: 3 },
            5: { row: 4, col: 4 },
            6: { row: 5, col: 1 },
            7: { row: 6, col: 6 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#FFD700', '#FFD700', '#FFD700', '#228B22', '#FFD700', '#FFD700', '#FFD700'],
                ['#FFD700', '#FFD700', '#228B22', '#228B22', '#228B22', '#FFD700', '#FFD700'],
                ['#228B22', '#228B22', '#228B22', '#228B22', '#228B22', '#228B22', '#228B22'],
                ['#FFD700', '#228B22', '#FFD700', '#228B22', '#FFD700', '#228B22', '#FFD700'],
                ['#FFD700', '#228B22', '#FFD700', '#228B22', '#FFD700', '#228B22', '#FFD700'],
                ['#FFD700', '#FFD700', '#228B22', '#228B22', '#228B22', '#FFD700', '#FFD700'],
                ['#C19A6B', '#C19A6B', '#C19A6B', '#228B22', '#C19A6B', '#C19A6B', '#C19A6B'],
            ],
            name: "Desert Cactus",
            emoji: "🌵"
        },
        timeTargets: { gold: 65, silver: 95, bronze: 140 }
    },
    {
        id: 19,
        name: "Robot",
        difficulty: 'expert',
        gridSize: 7,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 5, col: 1 },
            3: { row: 2, col: 2 },
            4: { row: 3, col: 3 },
            5: { row: 4, col: 4 },
            6: { row: 1, col: 5 },
            7: { row: 6, col: 6 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#87CEEB', '#C0C0C0', '#C0C0C0', '#FF0000', '#C0C0C0', '#C0C0C0', '#87CEEB'],
                ['#C0C0C0', '#00FF00', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#00FF00', '#C0C0C0'],
                ['#C0C0C0', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#C0C0C0'],
                ['#87CEEB', '#C0C0C0', '#C0C0C0', '#808080', '#C0C0C0', '#C0C0C0', '#87CEEB'],
                ['#87CEEB', '#C0C0C0', '#00BFFF', '#00BFFF', '#00BFFF', '#C0C0C0', '#87CEEB'],
                ['#87CEEB', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#C0C0C0', '#87CEEB'],
                ['#87CEEB', '#87CEEB', '#808080', '#808080', '#808080', '#87CEEB', '#87CEEB'],
            ],
            name: "Friendly Robot",
            emoji: "🤖"
        },
        timeTargets: { gold: 70, silver: 100, bronze: 150 }
    },
    {
        id: 20,
        name: "Crown",
        difficulty: 'expert',
        gridSize: 7,
        numbers: {
            1: { row: 0, col: 0 },
            2: { row: 1, col: 5 },
            3: { row: 2, col: 2 },
            4: { row: 3, col: 3 },
            5: { row: 4, col: 4 },
            6: { row: 5, col: 1 },
            7: { row: 6, col: 6 },
        },
        blocked: [],
        pattern: {
            colors: [
                ['#FFD700', '#8B0000', '#FFD700', '#00CED1', '#FFD700', '#8B0000', '#FFD700'],
                ['#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700'],
                ['#8B0000', '#FFD700', '#8B0000', '#FFD700', '#8B0000', '#FFD700', '#8B0000'],
                ['#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700'],
                ['#FFD700', '#FFD700', '#FFD700', '#8B0000', '#FFD700', '#FFD700', '#FFD700'],
                ['#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700'],
                ['#8B4513', '#8B4513', '#8B4513', '#8B4513', '#8B4513', '#8B4513', '#8B4513'],
            ],
            name: "Royal Crown",
            emoji: "👑"
        },
        timeTargets: { gold: 75, silver: 110, bronze: 160 }
    },
];

// Combine all levels
export const ALL_LEVELS: ZipLevel[] = [
    ...EASY_LEVELS,
    ...MEDIUM_LEVELS,
    ...HARD_LEVELS,
    ...EXPERT_LEVELS,
];

// Get level by ID
export function getLevelById(id: number): ZipLevel | undefined {
    return ALL_LEVELS.find(level => level.id === id);
}

// Get levels by difficulty
export function getLevelsByDifficulty(difficulty: ZipLevel['difficulty']): ZipLevel[] {
    return ALL_LEVELS.filter(level => level.difficulty === difficulty);
}

// Calculate score based on time and level
export function calculateScore(level: ZipLevel, timeSeconds: number): {
    score: number;
    stars: number;
    timeBonus: number;
} {
    const baseScore = level.gridSize * level.gridSize * 10;

    let stars = 0;
    let timeBonus = 0;

    if (timeSeconds <= level.timeTargets.gold) {
        stars = 3;
        timeBonus = Math.floor((level.timeTargets.gold - timeSeconds) * 5);
    } else if (timeSeconds <= level.timeTargets.silver) {
        stars = 2;
        timeBonus = Math.floor((level.timeTargets.silver - timeSeconds) * 3);
    } else if (timeSeconds <= level.timeTargets.bronze) {
        stars = 1;
        timeBonus = Math.floor((level.timeTargets.bronze - timeSeconds) * 1);
    }

    const difficultyMultiplier =
        level.difficulty === 'easy' ? 1 :
            level.difficulty === 'medium' ? 1.5 :
                level.difficulty === 'hard' ? 2 :
                    2.5; // expert

    const score = Math.floor((baseScore + timeBonus) * difficultyMultiplier);

    return { score, stars, timeBonus };
}
