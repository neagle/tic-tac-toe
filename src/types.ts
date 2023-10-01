export namespace GameTypes {
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
}

export namespace ChatTypes {
  export type Message = {
    clientId: string;
    text: string;
    timestamp: number;
    id: string;
  };
}
