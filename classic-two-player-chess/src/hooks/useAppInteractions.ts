

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { PieceInstance } from '../types';

interface UseAppInteractionsProps {
    game: Chess;
    pieceInstances: Record<string, PieceInstance | null>;
    executeMove: (move: Move) => void;
}

export function useAppInteractions({
    game,
    pieceInstances,
    executeMove,
}: UseAppInteractionsProps) {
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);
    const [validMoves, setValidMoves] = useState<string[]>([]);
    const [validMovesSAN, setValidMovesSAN] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSquareClick = (square: Square) => {
        const pieceOnSquare = game.get(square);
        const currentTurn = game.turn();

        // If a piece is already selected and we click a valid destination
        if (selectedSquare && validMoves && validMoves.includes(square)) {
            const move = {
                from: selectedSquare,
                to: square,
                promotion: 'q' // Default promotion
            };
            
            executeMove(move as Move);
            setSelectedSquare(null);
            setValidMoves([]);
            setValidMovesSAN([]);
            return;
        }

        // Selecting a piece to move
        if (pieceOnSquare && pieceOnSquare.color === currentTurn) {
            setSelectedSquare(square);
            const moves = game.moves({ square, verbose: true });
            setValidMoves(moves.map(m => m.to));
            setValidMovesSAN(moves.map(m => m.san));
        } else {
            // Deselect if clicking empty square or opponent piece
            setSelectedSquare(null);
            setValidMoves([]);
            setValidMovesSAN([]);
        }
    };

    return {
        selectedSquare,
        validMoves,
        validMovesSAN,
        error,
        hoveredSquare,
        handleSquareClick,
        setHoveredSquare,
    };
}

