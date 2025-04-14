import type React from 'react'
import Confetti from 'react-confetti'

interface GameEndScreenProps {
  finalScore: number
  onBackToMenu: () => void
}
const themeColors = ['#A78BFA', '#FBCFE8', '#FDE68A', '#FFFFFF']

const GameEndScreen: React.FC<GameEndScreenProps> = ({ finalScore, onBackToMenu }) => {
  return (
    <div className="absolute inset-0 bg-base-200 bg-opacity-90 flex flex-col items-center justify-center z-20 pointer-events-auto overflow-hidden">
      <Confetti
        recycle={true}
        numberOfPieces={200}
        gravity={0.01}
        initialVelocityX={{ min: -7, max: 7 }}
        initialVelocityY={{ min: 4, max: 8 }}
        colors={themeColors}
        tweenDuration={7000}
        opacity={0.9}
      />
      <div className="relative z-10 bg-base-100 p-8 rounded-lg shadow-xl text-center max-w-md w-full transform transition-all scale-100 opacity-100">
        <h2 className="text-4xl font-bold mb-3 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
          Game Over!
        </h2>
        <p className="text-xl text-base-content opacity-90 mb-6">Your final score is:</p>
        <p className="text-6xl font-extrabold text-primary mb-8">{finalScore}</p>
        <button onClick={onBackToMenu} className="btn-dream w-full">
          Back to Main Menu
        </button>
      </div>
    </div>
  )
}

export default GameEndScreen
