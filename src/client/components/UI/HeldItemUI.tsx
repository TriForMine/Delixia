import type React from 'react'
import { useMemo } from 'react'
import { useGameColyseusState, useGameColyseusRoom } from '@client/hooks/colyseus'
import { getItemDefinition } from '@shared/items'
import { Ingredient } from '@shared/types/enums'
import { motion, AnimatePresence } from 'motion/react'

const HeldItemUI: React.FC = () => {
  const room = useGameColyseusRoom()
  const localSessionId = room?.sessionId

  const localPlayer = useGameColyseusState((state) => (localSessionId ? state.players.get(localSessionId) : undefined))

  const heldIngredient = localPlayer?.holdedIngredient ?? Ingredient.None
  const isHoldingPlate = localPlayer?.holdingPlate ?? false

  const heldItemDef = useMemo(() => getItemDefinition(heldIngredient), [heldIngredient])
  const plateIconUrl = useMemo(() => getItemDefinition(Ingredient.Plate)?.icon, [])

  const hasItem = heldIngredient !== Ingredient.None || isHoldingPlate

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-end justify-center gap-2 pointer-events-none">
      <AnimatePresence>
        {hasItem && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-2 bg-base-100/80 backdrop-blur-sm p-2 rounded-lg shadow-md border border-primary/30"
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded ${isHoldingPlate ? 'bg-secondary/30 ring-2 ring-secondary' : 'bg-base-300/50 opacity-60'}`}
            >
              {isHoldingPlate && plateIconUrl && <img src={`/ingredients/${plateIconUrl}.png`} alt="Plate" className="w-10 h-10 object-contain" />}
              {!isHoldingPlate && <span className="text-xs text-base-content/50">Plate</span>}
            </div>

            <div
              className={`w-12 h-12 flex items-center justify-center rounded ${heldIngredient !== Ingredient.None ? 'bg-accent/30 ring-2 ring-accent' : 'bg-base-300/50 opacity-60'}`}
            >
              {heldIngredient !== Ingredient.None && heldItemDef?.icon && (
                <img src={`/ingredients/${heldItemDef.icon}.png`} alt={heldItemDef.name} className="w-10 h-10 object-contain" />
              )}
              {heldIngredient === Ingredient.None && <span className="text-xs text-base-content/50">Item</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HeldItemUI
