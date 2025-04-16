import type React from 'react'
import { useState, useEffect, useMemo, memo } from 'react'
import { useGameColyseusState } from '@client/hooks/colyseus'
import { getItemDefinition, getRecipeDefinition, getRecipeSteps } from '@shared/definitions'
import type { Order } from '@shared/schemas/Order.ts'
import { type Ingredient, InteractType } from '@shared/types/enums'
import { Flame, Slice, ChefHat, Clock, ArrowRight, Inbox, CookingPot, Dot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const calculateTimeInfo = (order: Order) => {
  const now = Date.now()
  const timeLeft = Math.max(0, order.deadline - now)
  const totalTime = order.deadline - order.createdAt
  const timePercentage = totalTime > 0 ? Math.min(100, Math.max(0, (timeLeft / totalTime) * 100)) : 0
  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const formattedTimeLeft = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const isUrgent = timeLeft < 10000 && timeLeft > 0
  const isExpired = timeLeft <= 0 && totalTime > 0

  return { timeLeft, timePercentage, formattedTimeLeft, isUrgent, isExpired, totalTime }
}

interface OrderCardProps {
  order: Order
}

const StationIcon: React.FC<{ type: InteractType; size?: number; className?: string }> = ({ type, size = 14, className = '' }) => {
  const iconProps = { size, strokeWidth: 2.5, className: `flex-shrink-0 ${className}` }
  switch (type) {
    case InteractType.Oven:
      return <Flame {...iconProps} className="text-orange-500" />
    case InteractType.ChoppingBoard:
      return <Slice {...iconProps} className="text-green-500" />
    case InteractType.Fridge:
    case InteractType.Stock:
      return <Inbox {...iconProps} className="text-blue-500" />
    default:
      return <CookingPot {...iconProps} />
  }
}

// --- Ingredient Icon Helper ---
const IngredientIconRaw: React.FC<{
  ingredient: Ingredient
  sizeClass?: string
  className?: string
  isResult?: boolean
}> = ({ ingredient, sizeClass = 'w-5 h-5', className = '' }) => {
  const def = getItemDefinition(ingredient)
  if (!def) return <Dot size={16} className="text-red-500" />
  const iconUrl = def.icon ? `/ingredients/${def.icon}.png` : '/icons/placeholder.png'

  return (
    <img
      src={iconUrl}
      alt={def.name}
      title={def.name}
      className={`${sizeClass} object-contain bg-white/60 p-0.5 rounded-sm shadow-xs flex-shrink-0 ${className}`}
      onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
    />
  )
}

const IngredientIcon = memo(IngredientIconRaw, (prevProps, nextProps) => {
  // Only re-render if ingredient or sizeClass changes
  return prevProps.ingredient === nextProps.ingredient && prevProps.sizeClass === nextProps.sizeClass
})

// --- Structure to hold processed recipe info ---
interface ProcessedRecipeInfo {
  ingredientsToProcess: { ingredient: Ingredient; station: InteractType }[]
  finalAssemblyIngredients: Ingredient[]
  finalAssemblyStation: InteractType | null
  allBaseIngredients: Ingredient[] // Still useful to know everything needed initially
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const finalRecipe = getRecipeDefinition(order.recipeId)
  const [timeInfo, setTimeInfo] = useState(() => calculateTimeInfo(order))

  // --- Timer effect to update countdown for order deadlines ---
  useEffect(() => {
    setTimeInfo(calculateTimeInfo(order))
    if (order.deadline > 0 && order.deadline > Date.now()) {
      const intervalId = setInterval(() => {
        const newTimeInfo = calculateTimeInfo(order)
        setTimeInfo(newTimeInfo)
        if (newTimeInfo.timeLeft <= 0) {
          clearInterval(intervalId)
        }
      }, 1000)
      return () => clearInterval(intervalId)
    }
    return undefined
  }, [order.id, order.deadline, order.createdAt])

  // --- Process Recipe Steps ---
  const processedInfo = useMemo((): ProcessedRecipeInfo => {
    const info: ProcessedRecipeInfo = {
      ingredientsToProcess: [],
      finalAssemblyIngredients: [],
      finalAssemblyStation: null,
      allBaseIngredients: [],
    }
    if (!order.recipeId) return info

    const steps = getRecipeSteps(order.recipeId)
    if (steps.length === 0) return info

    const processedOutputs = new Set<Ingredient>()
    const baseIngredients = new Set<Ingredient>()

    // First pass: identify items that are outputs of processing and all base ingredients
    steps.forEach((step) => {
      if (step.type === 'GET') {
        baseIngredients.add(step.ingredient)
      } else if (step.type === 'PROCESS') {
        processedOutputs.add(step.ingredient) // Mark this as a result of some process
        step.requiredIngredients?.forEach((req) => {
          // If a required ingredient is NOT an output of a PREVIOUS process,
          // AND it needs processing at THIS step (Chop/Oven), add it to the list.
          if (!processedOutputs.has(req) && (step.stationType === InteractType.ChoppingBoard || step.stationType === InteractType.Oven)) {
            const exists = info.ingredientsToProcess.some((p) => p.ingredient === req && p.station === step.stationType)
            if (!exists) {
              info.ingredientsToProcess.push({ ingredient: req, station: step.stationType })
            }
          }
        })
      }
    })

    info.allBaseIngredients = Array.from(baseIngredients)

    // Final Step Analysis
    const finalStep = steps[steps.length - 1]
    if (finalStep?.type === 'PROCESS') {
      info.finalAssemblyIngredients = finalStep.requiredIngredients ?? []
      info.finalAssemblyStation = finalStep.stationType
    } else if (finalStep?.type === 'GET') {
      info.finalAssemblyIngredients = [finalStep.ingredient]
      info.finalAssemblyStation = finalStep.stationType
    }

    return info
  }, [order.recipeId])

  if (!finalRecipe) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs">Error: Recipe not found!</div>
  }

  const finalItemDef = getItemDefinition(finalRecipe.result.ingredient)
  const finalIconUrl = finalItemDef?.icon ? `/ingredients/${finalItemDef.icon}.png` : '/ingredients/placeholder.png'

  return (
    // Card container - Keep original gradient, slightly more padding
    <div
      className={`bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 rounded-lg shadow-md px-3 py-2.5 w-full flex flex-col gap-2 transition-colors duration-300 ${timeInfo.isUrgent ? 'animate-pulse ring-2 ring-red-500 ring-offset-1 ring-offset-purple-300/50' : ''} ${timeInfo.isExpired ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Top part: Final item icon + name */}
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-11 h-11 bg-white/80 rounded-md overflow-hidden flex items-center justify-center shadow border border-white/30">
          {' '}
          {/* Slightly larger icon */}
          <img
            src={finalIconUrl}
            alt={finalRecipe.name}
            className="object-contain w-9 h-9"
            onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
          />
        </div>
        <span className="font-semibold text-base text-gray-800 truncate">{finalRecipe.name}</span>
      </div>

      {/* --- NEW: Multi-stage Icon Display --- */}
      <div className="flex flex-col gap-1.5 bg-black/10 p-1.5 rounded-md mt-1">
        {/* Stage 1: Ingredients Requiring Processing */}
        {processedInfo.ingredientsToProcess.length > 0 && (
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
            {/* Group by station? Or just list pairs? Let's try pairs for now */}
            {processedInfo.ingredientsToProcess.map((proc, index) => (
              <div key={`${order.id}-proc-${index}`} className="flex items-center gap-0.5 bg-white/40 px-1 py-0.5 rounded">
                <IngredientIcon ingredient={proc.ingredient} sizeClass="w-5 h-5" />
                <ArrowRight size={10} className="text-gray-600" />
                <StationIcon type={proc.station} size={12} />
              </div>
            ))}
          </div>
        )}

        {/* Optional Separator between processing and final assembly */}
        {processedInfo.ingredientsToProcess.length > 0 && processedInfo.finalAssemblyIngredients.length > 0 && (
          <div className="h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent my-0.5"></div>
        )}

        {/* Stage 2: Final Assembly Ingredients */}
        {processedInfo.finalAssemblyIngredients.length > 0 && (
          <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap">
            {/* Icon indicating "final step" */}
            {processedInfo.finalAssemblyStation && (
              <StationIcon type={processedInfo.finalAssemblyStation} size={16} className="text-green-700 opacity-90 mr-1" />
            )}
            {processedInfo.finalAssemblyIngredients.map((ing, index) => (
              <IngredientIcon
                key={`${order.id}-final-${index}`}
                ingredient={ing}
                sizeClass="w-5 h-5"
                // Attempt to show the "result" icon if this ingredient was processed
                isResult={
                  processedInfo.ingredientsToProcess.some((p) => p.ingredient === ing) ||
                  getItemDefinition(ing)?.isResult ||
                  finalRecipe.result.ingredient === ing
                }
              />
            ))}
            {/* Maybe add a checkmark icon at the end? */}
            {/* <CheckCircle size={14} className="text-green-600 ml-1" /> */}
          </div>
        )}

        {/* Fallback if no details could be parsed */}
        {processedInfo.ingredientsToProcess.length === 0 &&
          processedInfo.finalAssemblyIngredients.length === 0 &&
          processedInfo.allBaseIngredients.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap text-xs text-gray-600 italic">
              (Requires:{' '}
              {processedInfo.allBaseIngredients.map((ing, i) => (
                <IngredientIcon key={i} ingredient={ing} sizeClass="w-4 h-4" />
              ))}{' '}
              )
            </div>
          )}
      </div>

      {/* --- Progress bar for order deadline countdown --- */}
      {timeInfo.totalTime > 0 && (
        <div className="flex items-center gap-1.5 w-full mt-2">
          <Clock
            size={13}
            className={`flex-shrink-0 ${timeInfo.isUrgent ? 'text-red-700' : 'text-gray-700'} ${timeInfo.isExpired ? 'text-gray-500' : ''}`}
          />
          <div className={`flex-grow bg-black/15 rounded-full h-2 overflow-hidden`}>
            <div /* Progress bar */
              className={`h-full rounded-full ${timeInfo.isUrgent ? 'bg-red-500' : 'bg-gradient-to-r from-green-400 to-emerald-500'} ${timeInfo.isExpired ? 'bg-gray-400' : ''} transition-all duration-500 ease-linear`}
              style={{ width: `${timeInfo.timePercentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Orders component that displays all current orders using OrderCard ---
export default function Orders() {
  const orders = useGameColyseusState((state) => state.orders)
  const sortedOrders = useMemo(() => {
    // Sort orders by expiration status and deadline
    if (!orders || orders.length === 0) return []
    return [...orders].sort((a, b) => {
      const aExpired = a.deadline > 0 && a.deadline <= Date.now()
      const bExpired = b.deadline > 0 && b.deadline <= Date.now()
      if (aExpired && !bExpired) return 1
      if (!aExpired && bExpired) return -1
      return (a.deadline || Infinity) - (b.deadline || Infinity) || a.createdAt - b.createdAt
    })
  }, [orders])

  // --- Fixed position container with scrolling for orders list ---
  return (
    <div className="fixed top-4 right-2 z-10 w-72 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden p-2 bg-black/40 backdrop-blur-sm rounded-lg shadow-lg flex flex-col">
      <h3 className="text-center font-semibold text-white/90 text-sm mb-2 flex items-center justify-center gap-1 flex-shrink-0">
        <ChefHat size={16} /> Orders
      </h3>
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => (
              <motion.div
                key={order.id} /* ... animation props ... */
                layout
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <OrderCard order={order} />
              </motion.div>
            ))
          ) : (
            <motion.div key="no-orders" /* ... */>
              <p className="text-center text-gray-300/70 text-xs italic py-4">No pending orders</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
