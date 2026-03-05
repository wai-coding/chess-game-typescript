import { useState, useCallback } from "react";
import {
  createGame,
  makeMove,
  undoMove,
  getLegalMoves,
  getCurrentPlayer,
  getGameStatus,
  getMoveHistory,
  exportFEN,
  loadFEN,
  validateFEN,
  Game,
} from "../../core/game";
import { Position, Move, PieceType, GameStatus } from "../../core/types";

function cloneGame(game: Game): Game {
  return {
    ...game,
    board: game.board.map((r) => r.map((p) => (p ? { ...p } : null))),
    history: game.history.map((h) => ({
      ...h,
      board: h.board.map((r) => r.map((p) => (p ? { ...p } : null))),
      castlingRights: { ...h.castlingRights },
      enPassantTarget: h.enPassantTarget ? { ...h.enPassantTarget } : null,
    })),
    castlingRights: { ...game.castlingRights },
    enPassantTarget: game.enPassantTarget ? { ...game.enPassantTarget } : null,
  };
}

export function useGame() {
  const [game, setGame] = useState<Game>(() => createGame());
  const [selected, setSelected] = useState<Position | null>(null);
  const [promotion, setPromotion] = useState<{ move: Move; options: PieceType[] } | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);

  const handleSelect = useCallback(
    (pos: Position) => {
      if (promotion) return;

      if (selected) {
        const legalMoves = getLegalMoves(game, selected);
        const move = legalMoves.find(
          (m) => m.to.row === pos.row && m.to.col === pos.col
        );

        if (move) {
          if (move.promotion) {
            setPromotion({ move, options: ["queen", "rook", "bishop", "knight"] });
          } else {
            const g = cloneGame(game);
            if (makeMove(g, move)) {
              setGame(g);
              setLastMove(move);
              setSelected(null);
            }
          }
          return;
        }

        setSelected(null);
      }

      const piece = game.board[pos.row]?.[pos.col];
      if (piece && piece.color === getCurrentPlayer(game)) {
        setSelected(pos);
      }
    },
    [game, selected, promotion]
  );

  const handlePromotion = useCallback(
    (promotionType: PieceType) => {
      if (!promotion) return;
      const move = { ...promotion.move, promotion: promotionType };
      const g = cloneGame(game);
      if (makeMove(g, move)) {
        setGame(g);
        setLastMove(move);
        setPromotion(null);
        setSelected(null);
      }
    },
    [game, promotion]
  );

  const handleUndo = useCallback(() => {
    const g = cloneGame(game);
    if (undoMove(g)) {
      setGame(g);
      const prev = g.history.length > 0 ? g.history[g.history.length - 1].move : null;
      setLastMove(prev);
      setSelected(null);
      setPromotion(null);
    }
  }, [game]);

  const handleReset = useCallback(() => {
    setGame(createGame());
    setSelected(null);
    setPromotion(null);
    setLastMove(null);
  }, []);

  const handleLoadFEN = useCallback((fen: string): string | null => {
    const error = validateFEN(fen);
    if (error) return error;
    const g = loadFEN(fen);
    if (!g) return "Failed to parse FEN";
    setGame(g);
    setSelected(null);
    setPromotion(null);
    setLastMove(null);
    return null;
  }, []);

  return {
    board: game.board,
    currentPlayer: getCurrentPlayer(game),
    status: getGameStatus(game),
    selected,
    handleSelect,
    legalMoves: selected ? getLegalMoves(game, selected) : [],
    lastMove,
    promotion,
    handlePromotion,
    handleUndo,
    handleReset,
    moveHistory: getMoveHistory(game),
    fen: exportFEN(game),
    handleLoadFEN,
  };
}
