import type React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '@client/store/useStore'
import { X } from 'lucide-react'
import SharedSettingsPanel from './SharedSettingsPanel'

interface InGameSettingsMenuProps {
  applySettingsChanges: () => void
}

const InGameSettingsMenu: React.FC<InGameSettingsMenuProps> = ({ applySettingsChanges }) => {
  const setInGameSettingsVisible = useStore((state) => state.setInGameSettingsVisible)
  const isVisible = useStore((state) => state.inGameSettingsVisible)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-x-0 top-[10%] sm:top-[15%] mx-auto w-[90%] max-w-xs z-30 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-base-100/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-primary/30 text-base-content">
            <button
              onClick={() => setInGameSettingsVisible(false)}
              className="absolute top-1.5 right-1.5 btn btn-ghost btn-xs btn-circle text-primary/70 hover:bg-error/20 hover:text-error"
              aria-label="Close"
            >
              <X size={16} strokeWidth={3} />
            </button>
            <h2 className="text-base font-bold mb-3 text-center text-primary">Quick Options ☕</h2>

            <div className="space-y-3">
              <SharedSettingsPanel applySettingsChanges={applySettingsChanges} size="small" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InGameSettingsMenu
