export enum PlayerName {
  X = "x",
  O = "o",
}

const piece = {
  X: "x",
  O: "o",
  EMPTY: "",
};
export type Piece = typeof piece[keyof typeof piece];

const gameResult = {
  DRAW: "draw",
  NORESULT: "",
};
export type GameResult = Piece & typeof gameResult[keyof typeof gameResult];

export type Grid = Array<Piece>[];

export type GameState = {
  grid: Grid;
  result: GameResult;
};

export type Game = {
  id: string;
  players: string[];
  state: GameState;
};
