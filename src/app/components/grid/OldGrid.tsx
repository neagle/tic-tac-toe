import { useMemo } from "react";
import { Game } from "../../../../pages/api/game";
import { isPlayersMove, gameResult } from "../../../../gameUtils";

interface GridProps {
  playerId: string;
  game: Game;
}

const Grid = ({ playerId, game }: GridProps) => {
  //console.log("game", game);

  if (game.players.length < 2) {
    return <div>Waiting for an opponent...</div>;
  }

  const state = game?.state;
  //console.log("state", state);

  const grid = state?.grid;
  //console.log("grid", grid);

  const isMyMove = useMemo(() => {
    if (!game) return false;

    const playerIsFirst = game.players[0] === playerId;
    return isPlayersMove(playerIsFirst, grid);
  }, [game, playerId, grid]);

  const result = useMemo(() => {
    return gameResult(game.state.grid);
  }, [game.state.grid]);

  const onMove = (row: number, column: number) => {
    if (!isMyMove) return;

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

  /*
  return (
    Array.isArray(grid) && (
      <>
        <h1>I am: {game.players[0] === playerId ? "×" : "○"}</h1>
        <h1>My move? {String(isMyMove)}</h1>
        {result && <h1>Result: {result}</h1>}
        {result && <button>Play again?</button>}
        <table className="text-2xl">
          <tbody>
            {grid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((column, columnIndex) => (
                  <td
                    key={columnIndex}
                    onClick={() => onMove(rowIndex, columnIndex)}
                    className={`${
                      !result && isMyMove && column === ""
                        ? "cursor-pointer"
                        : ""
                    } `}
                  >
                    {column || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  );
  */
  return (
    <>
      <h1>I am: {game.players[0] === playerId ? "×" : "○"}</h1>
      <h1>My move? {String(isMyMove)}</h1>
      {result && <h1>Result: {result}</h1>}
      {result && <button>Play again?</button>}
      <div className="flex justify-center items-center h-screen">
        <div className="grid grid-cols-3 gap-4 w-64 h-64">
          {grid.map((row, rowIndex) =>
            row.map((column, columnIndex) => (
              <button
                key={`${rowIndex}-${columnIndex}`}
                className={`w-full h-full border bg-white hover:bg-gray-100 focus:outline-none focus:bg-gray-200 ${
                  !result && isMyMove && column === "" ? "cursor-pointer" : ""
                }`}
                onClick={() => onMove(rowIndex, columnIndex)}
              >
                <span className="text-4xl">{column}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Grid;
