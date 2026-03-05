import React from "react";
import { PieceType, Color } from "../../core/types";

interface PromotionModalProps {
  options: PieceType[];
  color: Color;
  onSelect: (type: PieceType) => void;
}

const PIECE_SYMBOLS: Record<string, string> = {
  queen_white: "\u2655",
  rook_white: "\u2656",
  bishop_white: "\u2657",
  knight_white: "\u2658",
  queen_black: "\u265B",
  rook_black: "\u265C",
  bishop_black: "\u265D",
  knight_black: "\u265E",
};

const PromotionModal: React.FC<PromotionModalProps> = ({ options, color, onSelect }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "2px solid #333",
          borderRadius: 8,
          padding: "12px 16px",
          display: "flex",
          gap: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {options.map((type) => (
          <button
            key={type}
            style={{
              fontSize: 36,
              padding: "6px 10px",
              cursor: "pointer",
              background: "#f8f8f8",
              border: "1px solid #ccc",
              borderRadius: 6,
              lineHeight: 1,
            }}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
            onClick={() => onSelect(type)}
          >
            {PIECE_SYMBOLS[`${type}_${color}`]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromotionModal;
