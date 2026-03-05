import { BoardState, Color, Move, Piece, PieceType, Position } from "./types";
import { cloneBoard, findKing, getPiece, setPiece } from "./board";
import { generateLegalMoves } from "./moveGenerator";
import { isKingInCheck, isSquareAttacked } from "./rules";

const FILES = "abcdefgh";
const PIECE_LETTERS: Record<PieceType, string> = {
  pawn: "",
  knight: "N",
  bishop: "B",
  rook: "R",
  queen: "Q",
  king: "K",
};

function toAlgebraic(pos: Position): string {
  return FILES[pos.col] + (pos.row + 1);
}

export function moveToSAN(
  board: BoardState,
  move: Move,
  color: Color,
  castlingRights: { whiteKingSide: boolean; whiteQueenSide: boolean; blackKingSide: boolean; blackQueenSide: boolean },
  enPassantTarget: Position | null
): string {
  const piece = getPiece(board, move.from);
  if (!piece) return "";

  if (move.isCastling) {
    const base = move.to.col === 6 ? "O-O" : "O-O-O";
    const suffix = getSuffix(board, move, piece, castlingRights, enPassantTarget);
    return base + suffix;
  }

  const captured = move.isEnPassant
    ? getPiece(board, { row: move.from.row, col: move.to.col })
    : getPiece(board, move.to);
  const isCapture = captured !== null;

  let san = "";
  const letter = PIECE_LETTERS[piece.type];

  if (piece.type === "pawn") {
    if (isCapture) {
      san += FILES[move.from.col];
    }
  } else {
    san += letter;
    san += disambiguate(board, move, piece, color, castlingRights, enPassantTarget);
  }

  if (isCapture) {
    san += "x";
  }

  san += toAlgebraic(move.to);

  if (move.promotion) {
    san += "=" + PIECE_LETTERS[move.promotion];
  }

  san += getSuffix(board, move, piece, castlingRights, enPassantTarget);
  return san;
}

function disambiguate(
  board: BoardState,
  move: Move,
  piece: Piece,
  color: Color,
  castlingRights: { whiteKingSide: boolean; whiteQueenSide: boolean; blackKingSide: boolean; blackQueenSide: boolean },
  enPassantTarget: Position | null
): string {
  const allMoves = generateLegalMoves(board, color, {
    enPassantTarget: enPassantTarget ?? undefined,
    canCastleKingSide: color === "white" ? castlingRights.whiteKingSide : castlingRights.blackKingSide,
    canCastleQueenSide: color === "white" ? castlingRights.whiteQueenSide : castlingRights.blackQueenSide,
    isSquareAttacked,
  });

  const ambiguous = allMoves.filter(
    (m) =>
      m.to.row === move.to.row &&
      m.to.col === move.to.col &&
      (m.from.row !== move.from.row || m.from.col !== move.from.col)
  ).filter((m) => {
    const p = getPiece(board, m.from);
    return p && p.type === piece.type;
  });

  if (ambiguous.length === 0) return "";

  // SAN disambiguation: prefer file, then rank, then both (e.g. Rae1, R1e1, Ra1e1)
  const sameFile = ambiguous.some((m) => m.from.col === move.from.col);
  const sameRank = ambiguous.some((m) => m.from.row === move.from.row);

  if (!sameFile) return FILES[move.from.col];
  if (!sameRank) return String(move.from.row + 1);
  return FILES[move.from.col] + (move.from.row + 1);
}

function getSuffix(
  board: BoardState,
  move: Move,
  piece: Piece,
  castlingRights: { whiteKingSide: boolean; whiteQueenSide: boolean; blackKingSide: boolean; blackQueenSide: boolean },
  enPassantTarget: Position | null
): string {
  const copy = cloneBoard(board);
  const enemy: Color = piece.color === "white" ? "black" : "white";

  if (move.isEnPassant) {
    copy[move.from.row][move.to.col] = null;
  }
  if (move.isCastling) {
    const row = piece.color === "white" ? 0 : 7;
    if (move.to.col === 6) {
      copy[row][5] = copy[row][7];
      copy[row][7] = null;
    } else {
      copy[row][3] = copy[row][0];
      copy[row][0] = null;
    }
  }
  if (move.promotion) {
    copy[move.to.row][move.to.col] = { type: move.promotion, color: piece.color, hasMoved: true };
  } else {
    copy[move.to.row][move.to.col] = { ...piece, hasMoved: true };
  }
  copy[move.from.row][move.from.col] = null;

  if (!isKingInCheck(copy, enemy)) return "";

  const enemyRights = {
    canCastleKingSide: enemy === "white" ? castlingRights.whiteKingSide : castlingRights.blackKingSide,
    canCastleQueenSide: enemy === "white" ? castlingRights.whiteQueenSide : castlingRights.blackQueenSide,
    isSquareAttacked,
  };
  const enemyMoves = generateLegalMoves(copy, enemy, enemyRights);
  return enemyMoves.length === 0 ? "#" : "+";
}

// FEN helpers

const FEN_PIECE_MAP: Record<string, { type: PieceType; color: Color }> = {
  P: { type: "pawn", color: "white" },
  N: { type: "knight", color: "white" },
  B: { type: "bishop", color: "white" },
  R: { type: "rook", color: "white" },
  Q: { type: "queen", color: "white" },
  K: { type: "king", color: "white" },
  p: { type: "pawn", color: "black" },
  n: { type: "knight", color: "black" },
  b: { type: "bishop", color: "black" },
  r: { type: "rook", color: "black" },
  q: { type: "queen", color: "black" },
  k: { type: "king", color: "black" },
};

function pieceToFenChar(piece: Piece): string {
  const map: Record<PieceType, string> = {
    pawn: "p",
    knight: "n",
    bishop: "b",
    rook: "r",
    queen: "q",
    king: "k",
  };
  const ch = map[piece.type];
  return piece.color === "white" ? ch.toUpperCase() : ch;
}

export function boardToFEN(
  board: BoardState,
  currentPlayer: Color,
  castlingRights: { whiteKingSide: boolean; whiteQueenSide: boolean; blackKingSide: boolean; blackQueenSide: boolean },
  enPassantTarget: Position | null,
  halfMoveClock: number,
  fullMoveNumber: number
): string {
  const ranks: string[] = [];
  for (let row = 7; row >= 0; row--) {
    let rank = "";
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (empty > 0) {
          rank += empty;
          empty = 0;
        }
        rank += pieceToFenChar(piece);
      } else {
        empty++;
      }
    }
    if (empty > 0) rank += empty;
    ranks.push(rank);
  }

  const placement = ranks.join("/");
  const active = currentPlayer === "white" ? "w" : "b";

  let castling = "";
  if (castlingRights.whiteKingSide) castling += "K";
  if (castlingRights.whiteQueenSide) castling += "Q";
  if (castlingRights.blackKingSide) castling += "k";
  if (castlingRights.blackQueenSide) castling += "q";
  if (!castling) castling = "-";

  const ep = enPassantTarget ? toAlgebraic(enPassantTarget) : "-";

  return `${placement} ${active} ${castling} ${ep} ${halfMoveClock} ${fullMoveNumber}`;
}

export interface ParsedFEN {
  board: BoardState;
  currentPlayer: Color;
  castlingRights: { whiteKingSide: boolean; whiteQueenSide: boolean; blackKingSide: boolean; blackQueenSide: boolean };
  enPassantTarget: Position | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

export function validateFEN(fen: string): string | null {
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) return "FEN must have 6 space-separated fields";

  const [placement, active, castling, ep, half, full] = parts;

  const ranks = placement.split("/");
  if (ranks.length !== 8) return "Piece placement must have 8 ranks";

  for (let i = 0; i < 8; i++) {
    let count = 0;
    for (const ch of ranks[i]) {
      if (ch >= "1" && ch <= "8") {
        count += parseInt(ch, 10);
      } else if (FEN_PIECE_MAP[ch]) {
        count++;
      } else {
        return `Invalid character '${ch}' in rank ${8 - i}`;
      }
    }
    if (count !== 8) return `Rank ${8 - i} does not have 8 squares`;
  }

  if (active !== "w" && active !== "b") return "Active color must be 'w' or 'b'";

  if (castling !== "-" && !/^[KQkq]{1,4}$/.test(castling)) {
    return "Invalid castling availability";
  }

  if (ep !== "-") {
    if (!/^[a-h][36]$/.test(ep)) return "Invalid en passant target square";
  }

  if (!/^\d+$/.test(half) || parseInt(half, 10) < 0) return "Invalid halfmove clock";
  if (!/^\d+$/.test(full) || parseInt(full, 10) < 1) return "Invalid fullmove number";

  return null;
}

export function parseFEN(fen: string): ParsedFEN | null {
  const error = validateFEN(fen);
  if (error) return null;

  const [placement, active, castling, ep, half, full] = fen.trim().split(/\s+/);
  const board: BoardState = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));

  const ranks = placement.split("/");
  for (let i = 0; i < 8; i++) {
    const row = 7 - i;
    let col = 0;
    for (const ch of ranks[i]) {
      if (ch >= "1" && ch <= "8") {
        col += parseInt(ch, 10);
      } else {
        const mapped = FEN_PIECE_MAP[ch];
        if (mapped) {
          const hasMoved = inferHasMoved(mapped.type, mapped.color, row, col);
          board[row][col] = { ...mapped, hasMoved };
          col++;
        }
      }
    }
  }

  const enPassantTarget = ep === "-" ? null : parseSquare(ep);

  return {
    board,
    currentPlayer: active === "w" ? "white" : "black",
    castlingRights: {
      whiteKingSide: castling.includes("K"),
      whiteQueenSide: castling.includes("Q"),
      blackKingSide: castling.includes("k"),
      blackQueenSide: castling.includes("q"),
    },
    enPassantTarget,
    halfMoveClock: parseInt(half, 10),
    fullMoveNumber: parseInt(full, 10),
  };
}

function parseSquare(sq: string): Position {
  return { row: parseInt(sq[1], 10) - 1, col: FILES.indexOf(sq[0]) };
}

function inferHasMoved(type: PieceType, color: Color, row: number, col: number): boolean {
  if (type === "king") {
    return !(color === "white" && row === 0 && col === 4) && !(color === "black" && row === 7 && col === 4);
  }
  if (type === "rook") {
    if (color === "white" && row === 0 && (col === 0 || col === 7)) return false;
    if (color === "black" && row === 7 && (col === 0 || col === 7)) return false;
    return true;
  }
  if (type === "pawn") {
    return !(color === "white" && row === 1) && !(color === "black" && row === 6);
  }
  return false;
}
