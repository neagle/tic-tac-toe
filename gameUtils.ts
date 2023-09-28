export const totalMoves = (grid: string[][]) => {
  return grid.reduce((acc, row) => {
    const rowMoves = row.reduce((acc, cell) => {
      return cell !== "" ? acc + 1 : acc;
    }, 0);
    return acc + rowMoves;
  }, 0);
};

export const isPlayersMove = (
  playerIsFirst: boolean,
  grid: string[][],
) => {
  const evenMoves = totalMoves(grid) % 2 === 0;
  return playerIsFirst ? evenMoves : !evenMoves;
};

export const getGameResult = (grid: string[][]) => {
  // Check rows
  for (let row = 0; row < 3; row++) {
    if (
      grid[row][0] !== "" && grid[row][0] === grid[row][1] &&
      grid[row][0] === grid[row][2]
    ) {
      return grid[row][0];
    }
  }

  // Check columns
  for (let col = 0; col < 3; col++) {
    if (
      grid[0][col] !== "" && grid[0][col] === grid[1][col] &&
      grid[0][col] === grid[2][col]
    ) {
      return grid[0][col];
    }
  }

  // Check diagonals
  if (
    grid[0][0] !== "" && grid[0][0] === grid[1][1] && grid[0][0] === grid[2][2]
  ) {
    return grid[0][0];
  }

  if (
    grid[0][2] !== "" && grid[0][2] === grid[1][1] && grid[0][2] === grid[2][0]
  ) {
    return grid[0][2];
  }

  // Check for draw
  if (grid.flat().every((cell) => cell !== "")) {
    return "draw";
  }

  // If no winner or draw
  return null;
};
