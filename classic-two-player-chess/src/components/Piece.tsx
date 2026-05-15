/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { PieceInstance } from '../types';
import { pieceToUnicode } from '../lib/utils';

interface PieceProps {
  piece: PieceInstance;
  squareSize: number;
  isSelected: boolean;
}

const Piece: React.FC<PieceProps> = ({ piece, squareSize, isSelected }) => {
  if (squareSize === 0) return null; // Don't render until board size is known

  const fileIndex = piece.square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rankIndex = 8 - parseInt(piece.square.substring(1), 10);

  const x = fileIndex * squareSize;
  const y = rankIndex * squareSize;

  const style = {
    transform: `translate(${x}px, ${y}px)`,
  } as React.CSSProperties;

  const classNames = [
    'chess-piece',
    piece.color === 'w' ? 'white' : 'black',
    isSelected ? 'selected-piece' : ''
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classNames}
      style={style}
      aria-hidden="true"
    >
      {pieceToUnicode[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
    </span>
  );
};

export default Piece;
