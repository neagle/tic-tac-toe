// Find out how many moves have been played on the grid
export const totalMoves = (grid: string[][]) => {
  return grid.reduce((acc, row) => {
    const rowMoves = row.reduce((acc, cell) => {
      return cell !== "" ? acc + 1 : acc;
    }, 0);
    return acc + rowMoves;
  }, 0);
};

// Find out if it is a given player's move
export const isPlayersMove = (
  playerIsFirst: boolean,
  grid: string[][],
) => {
  const evenMoves = totalMoves(grid) % 2 === 0;
  return playerIsFirst ? evenMoves : !evenMoves;
};

// Return null, "x", "o", or "draw"
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

// These classes are used to position the line that indicates where the win
// occurred
export const getGameResultClasses = (grid: string[][]) => {
  const classes = [];
  if (
    grid[0][0] !== "" &&
    grid[0][0] === grid[0][1] &&
    grid[0][0] === grid[0][2]
  ) {
    classes.push("horizontal", "top");
  } else if (
    grid[1][0] !== "" &&
    grid[1][0] === grid[1][1] &&
    grid[1][0] === grid[1][2]
  ) {
    classes.push("horizontal", "middle");
  } else if (
    grid[2][0] !== "" &&
    grid[2][0] === grid[2][1] &&
    grid[2][0] === grid[2][2]
  ) {
    classes.push("horizontal", "bottom");
  } else if (
    grid[0][0] !== "" &&
    grid[0][0] === grid[1][0] &&
    grid[0][0] === grid[2][0]
  ) {
    classes.push("vertical", "left");
  } else if (
    grid[0][1] !== "" &&
    grid[0][1] === grid[1][1] &&
    grid[0][1] === grid[2][1]
  ) {
    classes.push("vertical", "middle");
  } else if (
    grid[0][2] !== "" &&
    grid[0][2] === grid[1][2] &&
    grid[0][2] === grid[2][2]
  ) {
    classes.push("vertical", "right");
  } else if (
    grid[0][0] !== "" &&
    grid[0][0] === grid[1][1] &&
    grid[0][0] === grid[2][2]
  ) {
    classes.push("diagonal", "left");
  } else if (
    grid[2][0] !== "" &&
    grid[2][0] === grid[1][1] &&
    grid[2][0] === grid[0][2]
  ) {
    classes.push("diagonal", "right");
  }

  return classes;
};
