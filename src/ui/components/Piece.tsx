import React from "react";
import { Piece as PieceData } from "../../core/types";

interface PieceProps {
  piece: PieceData;
}

const SYMBOLS: Record<string, string> = {
  pawn_white: "\u2659",
  rook_white: "\u2656",
  knight_white: "\u2658",
  bishop_white: "\u2657",
  queen_white: "\u2655",
  king_white: "\u2654",
  pawn_black: "\u265F",
  rook_black: "\u265C",
  knight_black: "\u265E",
  bishop_black: "\u265D",
  queen_black: "\u265B",
  king_black: "\u265A",
};

const Piece: React.FC<PieceProps> = ({ piece }) => {
  const symbol = SYMBOLS[`${piece.type}_${piece.color}`] ?? "";
  return (
    <span
      style={{
        filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))",
        lineHeight: 1,
      }}
    >
      {symbol}
    </span>
  );
};

export default Piece;
