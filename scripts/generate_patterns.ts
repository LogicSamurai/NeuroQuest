
function generateSnake(rows: number, cols: number, numCount: number) {
    const path: { row: number, col: number }[] = [];
    for (let r = 0; r < rows; r++) {
        if (r % 2 === 0) {
            for (let c = 0; c < cols; c++) path.push({ row: r, col: c });
        } else {
            for (let c = cols - 1; c >= 0; c--) path.push({ row: r, col: c });
        }
    }
    return distributeNumbers(path, numCount);
}

function generateVerticalSnake(rows: number, cols: number, numCount: number) {
    const path: { row: number, col: number }[] = [];
    for (let c = 0; c < cols; c++) {
        if (c % 2 === 0) {
            for (let r = 0; r < rows; r++) path.push({ row: r, col: c });
        } else {
            for (let r = rows - 1; r >= 0; r--) path.push({ row: r, col: c });
        }
    }
    return distributeNumbers(path, numCount);
}

function distributeNumbers(path: { row: number, col: number }[], numCount: number) {
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
    return numbers;
}

console.log("Level 16 (7 nums):", JSON.stringify(generateSnake(7, 7, 7), null, 2));
console.log("Level 17 (5 nums):", JSON.stringify(generateVerticalSnake(7, 7, 5), null, 2));
