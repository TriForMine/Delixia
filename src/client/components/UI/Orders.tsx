import React, { useState, useEffect, useMemo, memo } from 'react';
import { useGameColyseusState } from '@client/hooks/colyseus';
import type { Order } from '@shared/schemas/Order.ts';
import { type Ingredient, InteractType } from '@shared/types/enums';
import { Flame, Slice, Inbox, CookingPot, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getItemDefinition } from '@shared/items';
import {findRecipeByResult, getRecipeDefinition} from '@shared/recipes.ts';
import { getRecipeSteps } from '@shared/recipeSteps.ts';

// --- Calcul du temps restant ---
const calculateTimeInfo = (order: Order) => {
    const now = Date.now();
    const timeLeft = Math.max(0, order.deadline - now);
    const totalTime = order.deadline - order.createdAt;
    const timePercentage = totalTime > 0 ? Math.min(100, Math.max(0, (timeLeft / totalTime) * 100)) : 0;
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const formattedTimeLeft = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const isUrgent = timeLeft < 10000 && timeLeft > 0;
    const isExpired = timeLeft <= 0 && totalTime > 0;

    return { timeLeft, timePercentage, formattedTimeLeft, isUrgent, isExpired, totalTime };
};

// --- Interfaces ---
interface StationTask {
    station: InteractType | null;
    ingredients: Ingredient[];
}
interface ProcessedRecipeInfo {
    tasks: StationTask[];
    allBaseIngredients: Ingredient[];
}

// --- Process recipe steps ---
const processRecipeSteps = (recipeId: string): ProcessedRecipeInfo => {
    const info: ProcessedRecipeInfo = { tasks: [], allBaseIngredients: [] };
    if (!recipeId) return info;

    const steps = getRecipeSteps(recipeId); // Get the detailed steps
    if (steps.length === 0) return info;

    const baseIngredientsNeededGlobally = new Set<Ingredient>();
    // Use a Map where the value is a Set to automatically handle uniqueness per station
    const ingredientsPerStation = new Map<InteractType, Set<Ingredient>>();

    // First pass: Identify all base ingredients required anywhere in the process
    steps.forEach(step => {
        if (step.type === 'GET') {
            baseIngredientsNeededGlobally.add(step.ingredient);
        } else if (step.type === 'PROCESS') {
            // Also consider base ingredients required directly for a process step
            step.requiredIngredients?.forEach(req => {
                if (!findRecipeByResult(req)) { // Check if it's a base ingredient
                    baseIngredientsNeededGlobally.add(req);
                }
            });
        }
    });

    // Second pass: Determine which ingredients need to arrive at which station
    steps.forEach((step) => {
        if (step.type === 'PROCESS') {
            const stationType = step.stationType;
            const stationIngredients = ingredientsPerStation.get(stationType) || new Set<Ingredient>();

            step.requiredIngredients?.forEach((reqIngredient) => {
                // Check if this required ingredient is produced by another recipe step
                const producingRecipe = findRecipeByResult(reqIngredient);

                if (!producingRecipe || producingRecipe.stationType !== stationType) {
                    stationIngredients.add(reqIngredient);
                }
            });

            if (stationIngredients.size > 0) {
                ingredientsPerStation.set(stationType, stationIngredients);
            }
        }
    });

    // Convert the map to the final task array structure
    ingredientsPerStation.forEach((ingredientsSet, station) => {
        if (ingredientsSet.size > 0) {
            info.tasks.push({ station, ingredients: Array.from(ingredientsSet) });
        }
    });


    // Add the consolidated Stock task using all identified base ingredients
    if (baseIngredientsNeededGlobally.size > 0) {
        info.tasks.push({
            station: InteractType.Stock, // Representing all stock points
            ingredients: Array.from(baseIngredientsNeededGlobally)
        });
        info.allBaseIngredients = Array.from(baseIngredientsNeededGlobally); // Keep this for potential future use
    }


    // Sort tasks for consistent display order (e.g., Stock -> Oven -> Chopping Board)
    const stationOrder: (InteractType | null)[] = [
        InteractType.Stock, // Or Fridge, whichever represents base ingredient source
        InteractType.Oven,
        InteractType.ChoppingBoard,
        InteractType.ServingBoard, // Add other stations if needed
        null // Catch-all for any other station types
    ];
    info.tasks.sort((a, b) => {
        const indexA = stationOrder.indexOf(a.station);
        const indexB = stationOrder.indexOf(b.station);
        const finalIndexA = indexA === -1 ? Infinity : indexA;
        const finalIndexB = indexB === -1 ? Infinity : indexB;
        return finalIndexA - finalIndexB;
    });

    return info;
};


// --- Icône de station ---
const StationIcon: React.FC<{ type: InteractType; size?: number }> = ({ type, size = 16 }) => {
    const iconProps = { size, strokeWidth: 2, className: 'flex-shrink-0' };
    switch (type) {
        case InteractType.Oven:
            return <Flame {...iconProps} className="text-rose-600" />;
        case InteractType.ChoppingBoard:
            return <Slice {...iconProps} className="text-purple-700" />;
        case InteractType.Fridge:
        case InteractType.Stock:
            return <Inbox {...iconProps} className="text-yellow-700" />;
        default:
            return <CookingPot {...iconProps} className="text-gray-700" />;
    }
};

// --- Icône d'ingrédient ---
const IngredientIcon: React.FC<{
    ingredient: Ingredient;
    sizeClass?: string;
    station?: InteractType | null;
}> = memo(({ ingredient, sizeClass = 'w-7 h-7', station }) => {
    const def = getItemDefinition(ingredient);
    const iconUrl = def?.icon ? `/ingredients/${def.icon}.png` : '/icons/placeholder.png';

    const stationBg = station === InteractType.Oven ? 'bg-rose-400/50' :
        station === InteractType.ChoppingBoard ? 'bg-purple-400/50' :
            station === InteractType.Fridge || station === InteractType.Stock ? 'bg-yellow-400/50' :
                'bg-gray-300/50';

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
    );
});

// --- Composant de carte de commande ---
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const finalRecipe = useMemo(() => getRecipeDefinition(order.recipeId), [order.recipeId]);
    const [timeInfo, setTimeInfo] = useState(() => calculateTimeInfo(order));
    const processedInfo = useMemo(() => processRecipeSteps(order.recipeId), [order.recipeId]);

    useEffect(() => {
        setTimeInfo(calculateTimeInfo(order));
        if (order.deadline > 0 && order.deadline > Date.now()) {
            const intervalId = setInterval(() => {
                const newTimeInfo = calculateTimeInfo(order);
                setTimeInfo(newTimeInfo);
                if (newTimeInfo.timeLeft <= 0) {
                    clearInterval(intervalId);
                }
            }, 1000);
            return () => clearInterval(intervalId);
        }
        return undefined;
    }, [order.id, order.deadline, order.createdAt]);

    if (!finalRecipe) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs">
                Error: Recipe not found!
            </div>
        );
    }

    const finalItemDef = getItemDefinition(finalRecipe.result.ingredient);
    const finalIconUrl = finalItemDef?.icon ? `/ingredients/${finalItemDef.icon}.png` : '/icons/placeholder.png';

    return (
        <div
            className={`bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 rounded-lg shadow-md p-0.5 flex flex-col gap-1 w-full ${
                timeInfo.isUrgent ? 'border-2 border-red-500' : ''
            } ${timeInfo.isExpired ? 'animate-blink' : ''}`}
        >
            {/* En-tête : Icône du plat avec cadre */}
            <div className="flex justify-center mt-1 mb-1">
                <div className="border-2 border-rose-400 rounded-full shadow-sm p-1">
                    <img
                        src={finalIconUrl}
                        alt="Final dish"
                        className="w-13 h-13 object-contain rounded-full"
                        onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
                    />
                </div>
            </div>

            {/* Tâches par station */}
            <div className="flex flex-col gap-1">
                {processedInfo.tasks.map((task, taskIndex) => (
                    <div key={`${order.id}-task-${taskIndex}`} className="flex items-center gap-0.5 justify-center">
                        {task.station && <StationIcon type={task.station} size={16} />}
                        <div className="flex gap-0.5">
                            {task.ingredients.map((ingredient, itemIndex) => (
                                <IngredientIcon
                                    key={`${order.id}-task-${taskIndex}-item-${itemIndex}`}
                                    ingredient={ingredient}
                                    sizeClass="w-7 h-7"
                                    station={task.station}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Barre de progression + temps */}
            {timeInfo.totalTime > 0 && (
                <div className="flex items-center gap-1 mt-1">
                    <div className="flex-grow h-3 bg-gray-400 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${timeInfo.isUrgent ? 'bg-red-500' : 'bg-purple-400'} transition-all duration-1000`}
                            style={{ width: `${timeInfo.timePercentage}%` }}
                        />
                    </div>
                    <span className={`text-sm ${timeInfo.isUrgent ? 'text-red-500' : 'text-gray-800'} font-semibold`}>
            {timeInfo.formattedTimeLeft}
          </span>
                </div>
            )}
        </div>
    );
};

// --- Composant principal des commandes ---
export default function Orders() {
    const orders = useGameColyseusState((state) => state.orders);
    const sortedOrders = useMemo(() => {
        if (!orders || orders.length === 0) return [];
        return [...orders].sort((a, b) => {
            const aExpired = a.deadline > 0 && a.deadline <= Date.now();
            const bExpired = b.deadline > 0 && b.deadline <= Date.now();
            if (aExpired && !bExpired) return 1;
            if (!aExpired && bExpired) return -1;
            return (a.deadline || Infinity) - (b.deadline || Infinity) || a.createdAt - b.createdAt;
        });
    }, [orders]);

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
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-gray-300/70 text-xs py-2"
                        >
                            No orders
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}