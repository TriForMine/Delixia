import type React from 'react'
import { useCallback } from 'react'
import { motion } from 'motion/react'
import { useStore } from '@client/store/useStore'
import { ArrowLeft, Play } from 'lucide-react'

interface TutorialItem {
  imageSrc: string
  description: string
}

const tutorialItems: TutorialItem[] = [
  {
    imageSrc: '/tuto/serving-board-min.png',
    description: 'Use the Serving Board [E] to place down plates, add final dishes to plates, or pick up completed orders.',
  },
  {
    imageSrc: '/tuto/chopping-board-min.png',
    description: 'Combine ingredients on the Chopping Board [E] according to recipes. Some items can be upgraded by adding more ingredients!',
  },
  {
    imageSrc: '/tuto/ingredients-min.png',
    description: 'Grab base ingredients (like Rice, Nori, Fish) from Stock Crates or Fridges [E]. Check recipes to see what you need!',
  },
  {
    imageSrc: '/tuto/oven-min.png',
    description: 'Place ingredients in the Oven [E] for timed processing (e.g., Rice -> Cooked Rice). Wait for it to finish!',
  },
  {
    imageSrc: '/tuto/customer-min.png',
    description:
      'Customers appear at seats with orders! Check the Orders UI (top-right), prepare the dish, and deliver it to their Seat [E] before the timer runs out!',
  },
  {
    imageSrc: '/tuto/sink-min.png',
    description: 'Dispose of unwanted items or dirty plates in the Trash [E]. Keep your kitchen tidy!',
  },
]

const TutorialPage: React.FC = () => {
  const setMode = useStore((state) => state.setMode)

  const handleContinue = useCallback(() => {
    setMode('roomList')
  }, [setMode])

  const handleBackToMenu = useCallback(() => {
    setMode('menu')
  }, [setMode])

  return (
    <motion.div
      key="tutorial-page"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-base-200 bg-opacity-95 flex flex-col items-center justify-center z-10 pointer-events-auto p-4 md:p-6"
    >
      <div className="bg-base-100 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-3xl text-base-content relative border border-secondary/20 flex flex-col">
        <button
          onClick={handleBackToMenu}
          className="absolute top-3 left-3 btn btn-ghost btn-sm btn-circle z-10 hover:bg-base-content/10"
          aria-label="Back to Menu"
        >
          <ArrowLeft className="text-secondary" size={24} strokeWidth={2.5} />
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
          How to Play?
        </h2>

        <div className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar max-h-[65vh]">
          {tutorialItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 bg-base-200/50 p-3 rounded-lg border border-base-300"
            >
              <img
                src={item.imageSrc}
                alt={`Tutorial step ${index + 1}`}
                className="w-32 h-32 object-contain rounded-md flex-shrink-0 border bg-base-100"
                onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
              />
              <p className="text-base-content/90 text-center sm:text-left text-md">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button onClick={handleContinue} className="btn-dream flex items-center justify-center gap-2 mx-auto">
            <Play size={20} strokeWidth={2.5} /> Got it, let's play!
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default TutorialPage
