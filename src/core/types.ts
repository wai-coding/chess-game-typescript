export type Color = "white" | "black";

export type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  promotion?: PieceType;
  isEnPassant?: boolean;
  isCastling?: boolean;
}

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved?: boolean;
}

export type BoardState = (Piece | null)[][];

export type GameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw";
