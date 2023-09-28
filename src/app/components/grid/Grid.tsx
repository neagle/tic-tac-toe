import { useMemo } from "react";
import { Game } from "../../../../pages/api/game";
import classnames from "classnames";
import {
  totalMoves,
  isPlayersMove,
  getGameResult,
} from "../../../../gameUtils";
import { X, Y } from "./Pieces";

type GridProps = {
  playerId: string;
  game: Game;
  gameResult: boolean | string | null;
  className?: string;
  setGame: (game: Game) => void;
  fetchGame: () => void;
};

const Grid = ({
  playerId,
  game,
  className = "",
  setGame,
  gameResult,
  fetchGame,
}: GridProps) => {
  if (game.players.length < 2) {
    return <div>Waiting for an opponent…</div>;
  }

  const state = game?.state;
  //console.log("state", state);

  const grid = state?.grid;
  //console.log("grid", grid);

  const isMyMove = useMemo(() => {
    if (!game) return false;

    const playerIsFirst = game.players[0] === playerId;
    return isPlayersMove(playerIsFirst, grid);
  }, [game?.state?.grid, playerId]);

  const onMove = (row: number, column: number) => {
    if (!isMyMove) return;
    if (grid[row][column] !== "") return;

    // Update the local game state so that we have instant feedback -- we'll
    // also receive an update via websocket shortly afterward
    const newGame = structuredClone(game);
    newGame.state.grid[row][column] = game.players[0] === playerId ? "x" : "o";
    setGame(newGame);

    console.log("move", row, column);

    fetch(`/api/game/${game.id}`, {
      method: "POST",
      // pass in rowIndex and cellIndex on the post body
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ row, column, playerId }),
    });
  };

  return (
    <>
      <Status game={game} playerId={playerId} />
      <section
        className={classnames({
          grid: true,
          "my-move": isMyMove && !gameResult,
          [className]: true,
        })}
      >
        {grid.map((row, rowIndex) => {
          return row.map((column, columnIndex) => {
            return (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className={classnames({
                  "cursor-pointer": isMyMove && column === "",
                  open: column === "",
                  filled: column !== "",
                })}
                onClick={() => onMove(rowIndex, columnIndex)}
              >
                {column && (column === "x" ? <X /> : <Y />)}
              </div>
            );
          });
        })}
        <Win grid={grid} />
      </section>
      {state.result && (
        <button onClick={fetchGame} className="border-4 border-black p-2">
          Play again?
        </button>
      )}
    </>
  );
};

const Win = ({ grid }) => {
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

  return classes?.length ? (
    <b className={classnames(["win", ...classes])}></b>
  ) : (
    ""
  );
};

const Status = ({ game, playerId }) => {
  console.log("game?", game);
  console.log("playerId", playerId);

  const { result } = game.state;

  let statusText;
  if (!result) {
    if (game.players.length < 2) {
      statusText = "Waiting for an opponent…";
    } else {
      statusText = `${
        game.players[0] === playerId ? "Your" : "Opponent’s"
      } turn.`;
    }
  } else {
    if (result === "draw") {
      statusText = "It’s a draw.";
    } else if (
      (result === "x" && game.players[0] === playerId) ||
      (result === "o" && game.players[1] === playerId)
    ) {
      statusText = "You won!";
    } else {
      statusText = "You lost!";
    }
  }

  return <div className="">{statusText}</div>;
};

export default Grid;
