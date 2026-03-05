import React from "react";

interface SquareProps {
  isLight: boolean;
  isSelected?: boolean;
  isLegal?: boolean;
  isLastMove?: boolean;
  isCheck?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const Square: React.FC<SquareProps> = ({
  isLight,
  isSelected,
  isLegal,
  isLastMove,
  isCheck,
  onClick,
  children,
}) => {
  let background = isLight ? "#f0d9b5" : "#b58863";
  if (isSelected) background = "#ffe066";
  else if (isCheck) background = "#e84040";
  else if (isLastMove) background = isLight ? "#c8e4b0" : "#8ab870";

  return (
    <div
      style={{
        background,
        width: 56,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 36,
        userSelect: "none",
        cursor: onClick ? "pointer" : undefined,
        position: "relative",
        transition: "background 0.15s ease",
        boxShadow: isSelected ? "inset 0 0 0 2px #d4af37" : undefined,
      }}
      onClick={onClick}
    >
      {isLegal && !children && (
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.18)",
            position: "absolute",
          }}
        />
      )}
      {isLegal && children && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            boxShadow: "inset 0 0 0 4px rgba(0, 0, 0, 0.18)",
            pointerEvents: "none",
          }}
        />
      )}
      <span style={{ position: "relative", zIndex: 1, lineHeight: 1 }}>
        {children}
      </span>
    </div>
  );
};

export default Square;
