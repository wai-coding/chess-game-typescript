import { BoardState, Color, GameStatus, Move, Piece, PieceType, Position } from "./types";
import { initializeBoard, cloneBoard, movePiece, getPiece, setPiece } from "./board";
import { generateLegalMoves } from "./moveGenerator";
import { isKingInCheck, isCheckmate, isStalemate, isInsufficientMaterial, isSquareAttacked } from "./rules";
import { moveToSAN, boardToFEN, parseFEN, validateFEN, ParsedFEN } from "./notation";

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

interface HistoryEntry {
  move: Move;
  san: string;
  captured: Piece | null;
  board: BoardState;
  currentPlayer: Color;
  status: GameStatus;
  castlingRights: CastlingRights;
  enPassantTarget: Position | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

export interface Game {
  board: BoardState;
  currentPlayer: Color;
  history: HistoryEntry[];
  status: GameStatus;
  castlingRights: CastlingRights;
  enPassantTarget: Position | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

export function createGame(): Game {
  return {
    board: initializeBoard(),
    currentPlayer: "white",
    history: [],
    status: "playing",
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  };
}

function getAllLegalMoves(game: Game): Move[] {
  return generateLegalMoves(game.board, game.currentPlayer, {
    enPassantTarget: game.enPassantTarget ?? undefined,
    canCastleKingSide: getCastlingRight(game, game.currentPlayer, true),
    canCastleQueenSide: getCastlingRight(game, game.currentPlayer, false),
    isSquareAttacked,
  });
}

export function getLegalMoves(game: Game, position: Position): Move[] {
  const piece = getPiece(game.board, position);
  if (!piece || piece.color !== game.currentPlayer) return [];
  return getAllLegalMoves(game).filter(
    (m) => m.from.row === position.row && m.from.col === position.col
  );
}

export function makeMove(game: Game, move: Move): boolean {
  const legalMoves = getAllLegalMoves(game);
  const found = legalMoves.find(
    (m) =>
      m.from.row === move.from.row &&
      m.from.col === move.from.col &&
      m.to.row === move.to.row &&
      m.to.col === move.to.col &&
      (m.promotion || move.promotion ? m.promotion === move.promotion : true)
  );
  if (!found) return false;

  const piece = getPiece(game.board, found.from);
  if (!piece) return false;

  const san = moveToSAN(
    game.board,
    found,
    game.currentPlayer,
    game.castlingRights,
    game.enPassantTarget
  );

  const prevBoard = cloneBoard(game.board);
  const prevCastlingRights = { ...game.castlingRights };
  const prevEnPassantTarget = game.enPassantTarget ? { ...game.enPassantTarget } : null;
  const prevHalfMoveClock = game.halfMoveClock;
  const prevFullMoveNumber = game.fullMoveNumber;

  let captured: Piece | null = getPiece(game.board, found.to);

  if (found.isEnPassant) {
    captured = getPiece(game.board, { row: found.from.row, col: found.to.col });
    setPiece(game.board, { row: found.from.row, col: found.to.col }, null);
  }

  if (found.isCastling) {
    const row = piece.color === "white" ? 0 : 7;
    if (found.to.col === 6) {
      const rook = getPiece(game.board, { row, col: 7 });
      setPiece(game.board, { row, col: 5 }, rook ? { ...rook, hasMoved: true } : null);
      setPiece(game.board, { row, col: 7 }, null);
    } else if (found.to.col === 2) {
      const rook = getPiece(game.board, { row, col: 0 });
      setPiece(game.board, { row, col: 3 }, rook ? { ...rook, hasMoved: true } : null);
      setPiece(game.board, { row, col: 0 }, null);
    }
  }

  if (found.promotion) {
    setPiece(game.board, found.to, { type: found.promotion, color: piece.color, hasMoved: true });
    setPiece(game.board, found.from, null);
  } else {
    movePiece(game.board, found.from, found.to);
  }

  updateCastlingRights(game, found, piece);

  // En passant is only valid immediately after a double pawn push;
  // clear the target on every other move to enforce this one-move window.
  if (piece.type === "pawn" && Math.abs(found.to.row - found.from.row) === 2) {
    game.enPassantTarget = {
      row: (found.from.row + found.to.row) / 2,
      col: found.from.col,
    };
  } else {
    game.enPassantTarget = null;
  }

  if (piece.type === "pawn" || captured) {
    game.halfMoveClock = 0;
  } else {
    game.halfMoveClock++;
  }

  if (game.currentPlayer === "black") {
    game.fullMoveNumber++;
  }

  game.history.push({
    move: found,
    san,
    captured,
    board: prevBoard,
    currentPlayer: game.currentPlayer,
    status: game.status,
    castlingRights: prevCastlingRights,
    enPassantTarget: prevEnPassantTarget,
    halfMoveClock: prevHalfMoveClock,
    fullMoveNumber: prevFullMoveNumber,
  });

  game.currentPlayer = game.currentPlayer === "white" ? "black" : "white";
  game.status = computeStatus(game);

  return true;
}

export function undoMove(game: Game): boolean {
  const entry = game.history.pop();
  if (!entry) return false;

  game.board = entry.board;
  game.currentPlayer = entry.currentPlayer;
  game.status = entry.status;
  game.castlingRights = entry.castlingRights;
  game.enPassantTarget = entry.enPassantTarget;
  game.halfMoveClock = entry.halfMoveClock;
  game.fullMoveNumber = entry.fullMoveNumber;

  return true;
}

function computeStatus(game: Game): GameStatus {
  const opts = {
    enPassantTarget: game.enPassantTarget ?? undefined,
    canCastleKingSide: getCastlingRight(game, game.currentPlayer, true),
    canCastleQueenSide: getCastlingRight(game, game.currentPlayer, false),
  };

  if (isCheckmate(game.board, game.currentPlayer, opts)) return "checkmate";
  if (isStalemate(game.board, game.currentPlayer, opts)) return "stalemate";
  if (isInsufficientMaterial(game.board)) return "draw";
  if (game.halfMoveClock >= 100) return "draw";
  if (isKingInCheck(game.board, game.currentPlayer)) return "check";
  return "playing";
}

export function getCurrentPlayer(game: Game): Color {
  return game.currentPlayer;
}

export function getGameStatus(game: Game): GameStatus {
  return game.status;
}

export function getCastlingRight(game: Game, color: Color, kingSide: boolean): boolean {
  if (color === "white") {
    return kingSide ? game.castlingRights.whiteKingSide : game.castlingRights.whiteQueenSide;
  }
  return kingSide ? game.castlingRights.blackKingSide : game.castlingRights.blackQueenSide;
}

function updateCastlingRights(game: Game, move: Move, piece: Piece): void {
  if (piece.type === "king") {
    if (piece.color === "white") {
      game.castlingRights.whiteKingSide = false;
      game.castlingRights.whiteQueenSide = false;
    } else {
      game.castlingRights.blackKingSide = false;
      game.castlingRights.blackQueenSide = false;
    }
  }

  if (piece.type === "rook") {
    if (piece.color === "white") {
      if (move.from.row === 0 && move.from.col === 0) game.castlingRights.whiteQueenSide = false;
      if (move.from.row === 0 && move.from.col === 7) game.castlingRights.whiteKingSide = false;
    } else {
      if (move.from.row === 7 && move.from.col === 0) game.castlingRights.blackQueenSide = false;
      if (move.from.row === 7 && move.from.col === 7) game.castlingRights.blackKingSide = false;
    }
  }

  if (move.to.row === 0 && move.to.col === 0) game.castlingRights.whiteQueenSide = false;
  if (move.to.row === 0 && move.to.col === 7) game.castlingRights.whiteKingSide = false;
  if (move.to.row === 7 && move.to.col === 0) game.castlingRights.blackQueenSide = false;
  if (move.to.row === 7 && move.to.col === 7) game.castlingRights.blackKingSide = false;
}

export function getMoveHistory(game: Game): string[] {
  return game.history.map((h) => h.san);
}

export function exportFEN(game: Game): string {
  return boardToFEN(
    game.board,
    game.currentPlayer,
    game.castlingRights,
    game.enPassantTarget,
    game.halfMoveClock,
    game.fullMoveNumber
  );
}

export function loadFEN(fen: string): Game | null {
  const parsed = parseFEN(fen);
  if (!parsed) return null;

  const game: Game = {
    board: parsed.board,
    currentPlayer: parsed.currentPlayer,
    history: [],
    status: "playing",
    castlingRights: parsed.castlingRights,
    enPassantTarget: parsed.enPassantTarget,
    halfMoveClock: parsed.halfMoveClock,
    fullMoveNumber: parsed.fullMoveNumber,
  };

  game.status = computeStatus(game);
  return game;
}

export { validateFEN } from "./notation";
