import { useAppContext } from "../../app";
import * as GameTypes from "../../../types/Game";
import classnames from "classnames";
import { getGameResult, getGameResultClasses } from "../../../gameUtils";
import { X, Y } from "./Pieces";

type GridProps = {
  className?: string;
};

const Grid = ({ className = "" }: GridProps) => {
  const { playerId, game, setGame, gameResult, fetchGame, isMyMove } =
    useAppContext();

  // If there's only one player, we're waiting for the game to begin.
  if (game.players.length < 2) {
    return <div>*** Waiting for an opponent…</div>;
  }

  // Set some shortcuts for the sake of brevity
  const state = game?.state;
  const grid = state?.grid;

  const onMove = (row: number, column: number) => {
    // Can't move if the game is over
    if (gameResult) return;

    // Can't move if it's not your turn
    if (!isMyMove) return;

    // Can't move if there's already a piece there
    if (grid[row][column] !== "") return;

    // (We'll make sure the back end doesn't allow these, either!)

    // Optimistically update the local game state so that we have instant
    // feedback -- we'll also receive an update via websocket shortly afterward
    const newGame = structuredClone(game);
    newGame.state.grid[row][column] = game.players[0] === playerId ? "x" : "o";
    newGame.state.result = getGameResult(newGame.state.grid);
    setGame(newGame);

    // Send the move to the back end
    fetch(`/api/game/${game.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ row, column, playerId }),
    }).catch((error) => {
      console.error("Error:", error);
    });
  };

  return (
    <>
      <Status game={game} playerId={playerId} isMyMove={isMyMove} />
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
                  "cursor-pointer": isMyMove && column === "" && !gameResult,
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
        <button
          onClick={() => {
            fetchGame(true)
              .then(setGame)
              .catch((error) => console.log(error));
          }}
          className="border-4 border-black p-2 hover:bg-green-500 transition-colors mb-8 sm:mb-0"
        >
          Play again?
        </button>
      )}
    </>
  );
};

// Draw a line through the winning pieces
const Win = ({ grid }: { grid: string[][] }) => {
  // These classes (e.g. "top", "horizontal") are used to position the line via
  // CSS in globals
  const classes = getGameResultClasses(grid);

  return classes?.length ? (
    <b className={classnames(["win", ...classes])}></b>
  ) : (
    ""
  );
};

// This status component is shown above the grid, showing whose turn it is, or
// whether the game has been won/lost/drawn.
const Status = ({
  game,
  playerId,
  isMyMove,
}: {
  game: GameTypes.Game;
  playerId: string;
  isMyMove: boolean;
}) => {
  const { result } = game.state;

  let statusText;
  if (!result) {
    if (game.players.length < 2) {
      statusText = "Waiting for an opponent…";
    } else {
      statusText = `${isMyMove ? "Your" : "Opponent’s"} turn.`;
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
