import type React from 'react'
import { useMemo, memo } from 'react'
import { useGameColyseusState } from '@client/hooks/colyseus'
import type { Order } from '@shared/schemas/Order.ts'
import { type Ingredient, InteractType } from '@shared/types/enums'
import { Flame, Slice, Inbox, CookingPot, ChefHat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getItemDefinition } from '@shared/items'
import { findRecipeByResult, getRecipeDefinition } from '@shared/recipes.ts'
import { getRecipeSteps } from '@shared/recipeSteps.ts'

interface StationTask {
  station: InteractType | null
  ingredients: Ingredient[]
}
interface ProcessedRecipeInfo {
  tasks: StationTask[]
  allBaseIngredients: Ingredient[]
}

const processRecipeSteps = (recipeId: string): ProcessedRecipeInfo => {
  const info: ProcessedRecipeInfo = { tasks: [], allBaseIngredients: [] }
  if (!recipeId) return info

  const steps = getRecipeSteps(recipeId)
  if (steps.length === 0) return info

  const baseIngredientsNeededGlobally = new Set<Ingredient>()
  const ingredientsPerStation = new Map<InteractType, Set<Ingredient>>()

  steps.forEach((step) => {
    if (step.type === 'GET') {
      baseIngredientsNeededGlobally.add(step.ingredient)
    } else if (step.type === 'PROCESS') {
      step.requiredIngredients?.forEach((req) => {
        if (!findRecipeByResult(req)) {
          baseIngredientsNeededGlobally.add(req)
        }
      })
    }
  })

  steps.forEach((step) => {
    if (step.type === 'PROCESS') {
      const stationType = step.stationType
      const stationIngredients = ingredientsPerStation.get(stationType) || new Set<Ingredient>()

      step.requiredIngredients?.forEach((reqIngredient) => {
        const producingRecipe = findRecipeByResult(reqIngredient)
        if (!producingRecipe || producingRecipe.stationType !== stationType) {
          stationIngredients.add(reqIngredient)
        }
      })

      if (stationIngredients.size > 0) {
        ingredientsPerStation.set(stationType, stationIngredients)
      }
    }
  })

  ingredientsPerStation.forEach((ingredientsSet, station) => {
    if (ingredientsSet.size > 0) {
      info.tasks.push({ station, ingredients: Array.from(ingredientsSet) })
    }
  })

  if (baseIngredientsNeededGlobally.size > 0) {
    info.tasks.push({
      station: InteractType.Stock,
      ingredients: Array.from(baseIngredientsNeededGlobally),
    })
    info.allBaseIngredients = Array.from(baseIngredientsNeededGlobally)
  }

  const stationOrder: (InteractType | null)[] = [InteractType.Stock, InteractType.Oven, InteractType.ChoppingBoard, InteractType.ServingBoard, null]
  info.tasks.sort((a, b) => {
    const indexA = stationOrder.indexOf(a.station)
    const indexB = stationOrder.indexOf(b.station)
    const finalIndexA = indexA === -1 ? Infinity : indexA
    const finalIndexB = indexB === -1 ? Infinity : indexB
    return finalIndexA - finalIndexB
  })

  return info
}

const StationIcon: React.FC<{ type: InteractType; size?: number }> = ({ type, size = 16 }) => {
  const iconProps = { size, strokeWidth: 2, className: 'flex-shrink-0' }
  switch (type) {
    case InteractType.Oven:
      return <Flame {...iconProps} className="text-rose-600" />
    case InteractType.ChoppingBoard:
      return <Slice {...iconProps} className="text-purple-700" />
    case InteractType.Fridge:
    case InteractType.Stock:
      return <Inbox {...iconProps} className="text-yellow-700" />
    default:
      return <CookingPot {...iconProps} className="text-gray-700" />
  }
}

const IngredientIcon: React.FC<{
  ingredient: Ingredient
  sizeClass?: string
  station?: InteractType | null
}> = memo(({ ingredient, sizeClass = 'w-7 h-7', station }) => {
  const def = getItemDefinition(ingredient)
  const iconUrl = def?.icon ? `/ingredients/${def.icon}.png` : '/icons/placeholder.png'

  const stationBg =
    station === InteractType.Oven
      ? 'bg-rose-400/50'
      : station === InteractType.ChoppingBoard
        ? 'bg-purple-400/50'
        : station === InteractType.Fridge || station === InteractType.Stock
          ? 'bg-yellow-400/50'
          : 'bg-gray-300/50'

  return (
    <div className={`flex items-center gap-0.5 ${station ? stationBg : 'bg-gray-300/30'} rounded-md px-0.5 py-0.5`}>
      <img
        src={iconUrl}
        alt={def?.name || 'Unknown'}
        title={def?.name}
        className={`${sizeClass} object-contain rounded-full`}
        onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
      />
    </div>
  )
})

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const finalRecipe = useMemo(() => getRecipeDefinition(order.recipeId), [order.recipeId])
  const processedInfo = useMemo(() => processRecipeSteps(order.recipeId), [order.recipeId])
  const { timeLeft, totalDuration } = order
  const timePercentage = totalDuration > 0 ? Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100)) : 0
  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const formattedTimeLeft = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const isUrgent = timeLeft <= 10000 && timeLeft > 0
  const isExpired = timeLeft <= 0 && totalDuration > 0

  if (!finalRecipe) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs">Error: Recipe not found!</div>
  }

  const finalItemDef = getItemDefinition(finalRecipe.result.ingredient)
  const finalIconUrl = finalItemDef?.icon ? `/ingredients/${finalItemDef.icon}.png` : '/icons/placeholder.png'

  return (
    <div
      className={`bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 rounded-lg shadow-md p-0.5 flex flex-col gap-1 w-full ${
        isUrgent ? 'border-2 border-red-500' : ''
      } ${isExpired ? 'animate-blink' : ''}`}
    >
      <div className="flex justify-center mt-1 mb-1">
        <motion.div
          className="relative bg-white/100 rounded-full shadow-lg p-1"
          style={{ boxShadow: '0 0 10px rgba(159, 122, 234, 0.5)' }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(244, 114, 182, 0.3) 70%, transparent 100%)',
            }}
          />
          <img
            src={finalIconUrl}
            alt="Final dish"
            className="w-10 h-10 object-contain rounded-full relative z-10"
            onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
          />
        </motion.div>
      </div>

      <div className="flex flex-col gap-1">
        {processedInfo.tasks.map((task, taskIndex) => (
          <div key={`${order.id}-task-${taskIndex}`} className="flex items-center gap-0.5 justify-center">
            {task.station && <StationIcon type={task.station} size={16} />}
            <div className="flex gap-0.5">
              {task.ingredients.map((ingredient, itemIndex) => (
                <IngredientIcon
                  key={`${order.id}-task-${taskIndex}-item-${itemIndex}`}
                  ingredient={ingredient}
                  sizeClass="w-5 h-5"
                  station={task.station}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalDuration > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <div className="flex-grow h-2 bg-gray-400 rounded-full overflow-hidden">
            <div
              className={`h-full ${isUrgent ? 'bg-red-500' : 'bg-green-400'} transition-all duration-1000`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
          <span className={`text-sm ${isUrgent ? 'text-red-500' : 'text-gray-800'} font-semibold`}>{formattedTimeLeft}</span>
        </div>
      )}
    </div>
  )
}

export default function Orders() {
  const orders = useGameColyseusState((state) => state.orders)
  const sortedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []
    // Sort by urgency (less time left first), then by creation time if deadlines are similar
    return [...orders].sort((a, b) => {
      const aIsExpired = a.timeLeft <= 0 && a.totalDuration > 0
      const bIsExpired = b.timeLeft <= 0 && b.totalDuration > 0

      if (aIsExpired && !bIsExpired) return 1 // Expired orders last (or first depending on preference)
      if (!aIsExpired && bIsExpired) return -1
      if (aIsExpired && bIsExpired) return 0 // Keep relative order if both expired

      // Primarily sort by time left (ascending)
      const timeLeftDiff = a.timeLeft - b.timeLeft
      if (Math.abs(timeLeftDiff) > 50) {
        // Add a small tolerance if needed
        return timeLeftDiff
      }

      // Fallback to sorting by total duration? Or maybe recipe ID for consistency? Let's stick to timeLeft.
      return 0 // Keep original order if time left is very close
    })
  }, [orders])

  return (
    <div className="fixed top-4 right-2 z-10 w-52 max-h-[calc(100vh-8rem)] overflow-y-auto p-1 bg-black/40 backdrop-blur-sm rounded-lg shadow-lg">
      <h3 className="text-center font-bold text-white/90 text-xl mb-2 flex items-center justify-center gap-1 flex-shrink-0">
        <ChefHat size={18} strokeWidth={3} /> Orders
      </h3>
      <div className="flex flex-col gap-0.5">
        <AnimatePresence>
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <OrderCard order={order} />
              </motion.div>
            ))
          ) : (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-300/70 text-xs py-2">
              No orders
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
