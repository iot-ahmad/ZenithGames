
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Square as ChessJSSquare, Piece } from 'chess.js';

interface SquareProps {
  squareName: ChessJSSquare;
  isLight: boolean;
  pieceOnSquare: Piece | null;
  isSelected: boolean;
  onSquareClick: (square: ChessJSSquare) => void;
  onSquareHover: (square: ChessJSSquare | null) => void;
}

const Square: React.FC<SquareProps> = ({
  squareName, isLight, pieceOnSquare, isSelected,
  onSquareClick, onSquareHover
}) => {
  let pieceDescription = 'Empty square';
  if (pieceOnSquare) {
    const pieceTypeMap = {p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king"};
    pieceDescription = `${pieceOnSquare.color === 'w' ? 'White' : 'Black'} ${pieceTypeMap[pieceOnSquare.type]}`;
  }

  const classNames = [
    'square',
    isLight ? 'light' : 'dark',
    isSelected ? 'selected' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      onClick={() => onSquareClick(squareName)}
      onMouseEnter={() => onSquareHover(squareName)}
      role="button"
      aria-label={`Square ${squareName}, ${pieceDescription}`}
    >
      <span className="square-notation">{squareName}</span>
    </div>
  );
};

export default Square;
