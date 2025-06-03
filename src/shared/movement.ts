import type { MoveDirection } from "./game";
import type { GridType, N2, Rocket, Rockets } from "./grid";

export const getMovementSquaresUp = (
  board: GridType,
  rockets: Rockets,
  position: N2,
): N2[] => {
  const movementSquares: N2[] = [];
  for (let y = position.y - 1; y >= 0; y--) {
    if (
      y !== position.y &&
      y < board.length - 1 &&
      board[y + 1]![position.x]!.wallY
    ) {
      break;
    }

    if (Object.values(rockets).find((p) => p.x === position.x && p.y === y))
      break;

    movementSquares.push({
      x: position.x,
      y,
    });
  }

  return movementSquares;
};

export const getMovementSquaresDown = (
  board: GridType,
  rockets: Rockets,
  position: N2,
): N2[] => {
  const movementSquares: N2[] = [];
  for (let y = position.y + 1; y < board.length; y++) {
    if (y !== position.y && board[y]![position.x]!.wallY) {
      break;
    }

    if (Object.values(rockets).find((p) => p.x === position.x && p.y === y))
      break;

    movementSquares.push({
      x: position.x,
      y,
    });
  }

  return movementSquares;
};

export const getMovementSquaresLeft = (
  board: GridType,
  rockets: Rockets,
  position: N2,
): N2[] => {
  const movementSquares: N2[] = [];
  for (let x = position.x - 1; x >= 0; x--) {
    if (
      x !== position.x &&
      x < board[0]!.length - 1 &&
      board[position.y]![x + 1]!.wallX
    ) {
      break;
    }

    if (Object.values(rockets).find((p) => p.x === x && p.y === position.y))
      break;

    movementSquares.push({
      x,
      y: position.y,
    });
  }

  return movementSquares;
};

export const getMovementSquaresRight = (
  board: GridType,
  rockets: Rockets,
  position: N2,
): N2[] => {
  const movementSquares: N2[] = [];
  for (let x = position.x + 1; x < board.length; x++) {
    if (x !== position.x && board[position.y]![x]!.wallX) {
      break;
    }

    if (Object.values(rockets).find((p) => p.x === x && p.y === position.y))
      break;

    movementSquares.push({
      x,
      y: position.y,
    });
  }

  return movementSquares;
};

export const getCompletedMove = (
  board: GridType,
  rockets: Rockets,
  rocket: Rocket,
  direction: MoveDirection,
) => {
  let movedTo: N2;

  let squares: N2[] = [];

  console.log(rocket, direction, rockets);

  switch (direction) {
    case "up":
      squares = getMovementSquaresUp(board, rockets, rockets[rocket]);
      console.log("Squares", squares);
      movedTo = squares[squares.length - 1]!;
      break;
    case "down":
      squares = getMovementSquaresDown(board, rockets, rockets[rocket]);
      console.log("Squares", squares);
      movedTo = squares[squares.length - 1]!;
      break;
    case "left":
      squares = getMovementSquaresLeft(board, rockets, rockets[rocket]);
      console.log("Squares", squares);
      movedTo = squares[squares.length - 1]!;
      break;
    case "right":
      squares = getMovementSquaresRight(board, rockets, rockets[rocket]);
      console.log("Squares", squares);
      movedTo = squares[squares.length - 1]!;
      break;
  }
  return movedTo;
};

export const calculateMovementSquares = (
  board: GridType,
  rockets: Rockets,
  position: N2,
): N2[] => {
  const movementSquares: N2[] = [];

  movementSquares.push(...getMovementSquaresUp(board, rockets, position));
  movementSquares.push(...getMovementSquaresDown(board, rockets, position));
  movementSquares.push(...getMovementSquaresLeft(board, rockets, position));
  movementSquares.push(...getMovementSquaresRight(board, rockets, position));

  return movementSquares;
};
