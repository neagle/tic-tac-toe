import { useMemo } from "react";
import { Game } from "../../../../pages/api/game";
import classnames from "classnames";
import { isPlayersMove, getGameResultClasses } from "../../../../gameUtils";
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
  // If there's only one player, we're waiting for the game to begin.
  if (game.players.length < 2) {
    return <div>Waiting for an opponent…</div>;
  }

  // Set some shortcuts for the sake of brevity
  const state = game?.state;
  const grid = state?.grid;

  // Is it the current player's move?
  const isMyMove = useMemo(() => {
    if (!game) return false;

    const playerIsFirst = game.players[0] === playerId;
    return isPlayersMove(playerIsFirst, grid);
  }, [game?.state?.grid, playerId]);

  const onMove = (row: number, column: number) => {
    // Can't move if it's not your turn
    if (!isMyMove) return;

    // Can't move if there's already a piece there
    if (grid[row][column] !== "") return;

    // (We'll make sure the back end doesn't allow these, either!)

    // Optimistically update the local game state so that we have instant
    // feedback -- we'll also receive an update via websocket shortly afterward
    const newGame = structuredClone(game);
    newGame.state.grid[row][column] = game.players[0] === playerId ? "x" : "o";
    setGame(newGame);

    // Send the move to the back end
    fetch(`/api/game/${game.id}`, {
      method: "POST",
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
        <button
          onClick={fetchGame}
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
const Status = ({ game, playerId }: { game: Game; playerId: string }) => {
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
