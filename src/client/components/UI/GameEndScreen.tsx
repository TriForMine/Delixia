import React from 'react';
import { Award } from 'lucide-react';

interface GameEndScreenProps {
    finalScore: number;
    onBackToMenu: () => void;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({ finalScore, onBackToMenu }) => {
    return (
        <div className="absolute inset-0 bg-base-200 bg-opacity-90 flex flex-col items-center justify-center z-20 pointer-events-auto">
            <div className="bg-base-100 p-8 rounded-lg shadow-xl text-center max-w-md w-full transform transition-all scale-100 opacity-100">
                <Award className="mx-auto h-16 w-16 text-yellow-400 mb-4 animate-bounce" strokeWidth={1.5} />
                <h2 className="text-4xl font-bold mb-3 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
                    Game Over!
                </h2>
                <p className="text-xl text-base-content opacity-90 mb-6">Your final score is:</p>
                <p className="text-6xl font-extrabold text-primary mb-8">
                    {finalScore}
                </p>
                <button
                    onClick={onBackToMenu}
                    className="btn-dream w-full"
                >
                    Back to Main Menu
                </button>
            </div>
        </div>
    );
};

export default GameEndScreen;