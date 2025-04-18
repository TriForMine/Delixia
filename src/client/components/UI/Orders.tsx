import React, { useState, useEffect, useMemo, memo } from 'react';
import { useGameColyseusState } from '@client/hooks/colyseus';
import type { Order } from '@shared/schemas/Order.ts';
import { type Ingredient, InteractType } from '@shared/types/enums';
import { Flame, Slice, Inbox, CookingPot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getItemDefinition } from '@shared/items';
import { getRecipeDefinition } from '@shared/recipes.ts';
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
interface ProcessedRecipeInfo {
    ingredientsToProcess: { ingredient: Ingredient; station: InteractType }[];
    finalAssemblyIngredients: Ingredient[];
    finalAssemblyStation: InteractType | null;
    allBaseIngredients: Ingredient[];
}

// --- Traitement des étapes de recette ---
const processRecipeSteps = (recipeId: string): ProcessedRecipeInfo => {
    const info: ProcessedRecipeInfo = { ingredientsToProcess: [], finalAssemblyIngredients: [], finalAssemblyStation: null, allBaseIngredients: [] };
    if (!recipeId) return info;
    const steps = getRecipeSteps(recipeId);
    if (steps.length === 0) return info;

    const processedOutputs = new Set<Ingredient>();
    const baseIngredients = new Set<Ingredient>();

    steps.forEach((step) => {
        if (step.type === 'GET') {
            baseIngredients.add(step.ingredient);
        } else if (step.type === 'PROCESS') {
            processedOutputs.add(step.ingredient);
            step.requiredIngredients?.forEach((req) => {
                if (!processedOutputs.has(req) && (step.stationType === InteractType.ChoppingBoard || step.stationType === InteractType.Oven)) {
                    const exists = info.ingredientsToProcess.some((p) => p.ingredient === req && p.station === step.stationType);
                    if (!exists) info.ingredientsToProcess.push({ ingredient: req, station: step.stationType });
                }
            });
        }
    });
    info.allBaseIngredients = Array.from(baseIngredients);

    const finalStep = steps[steps.length - 1];
    if (finalStep?.type === 'PROCESS') {
        info.finalAssemblyIngredients = finalStep.requiredIngredients ?? [];
        info.finalAssemblyStation = finalStep.stationType;
    } else if (finalStep?.type === 'GET') {
        info.finalAssemblyIngredients = [finalStep.ingredient];
        info.finalAssemblyStation = finalStep.stationType;
    }

    return info;
};

// --- Icône de station ---
const StationIcon: React.FC<{ type: InteractType; size?: number }> = ({ type, size = 14 }) => {
    const iconProps = { size, strokeWidth: 2, className: 'flex-shrink-0' };
    switch (type) {
        case InteractType.Oven:
            return <Flame {...iconProps} className="text-orange-500" />;
        case InteractType.ChoppingBoard:
            return <Slice {...iconProps} className="text-green-500" />;
        case InteractType.Fridge:
        case InteractType.Stock:
            return <Inbox {...iconProps} className="text-blue-500" />;
        default:
            return <CookingPot {...iconProps} className="text-gray-600" />;
    }
};

// --- Icône d'ingrédient ---
const IngredientIcon: React.FC<{
    ingredient: Ingredient;
    sizeClass?: string;
    station?: InteractType | null;
}> = memo(({ ingredient, sizeClass = 'w-6 h-6', station }) => {
    const def = getItemDefinition(ingredient);
    const iconUrl = def?.icon ? `/ingredients/${def.icon}.png` : '/icons/placeholder.png';

    const stationBg = station === InteractType.Oven ? 'bg-orange-100/50' :
        station === InteractType.ChoppingBoard ? 'bg-green-100/50' :
            station === InteractType.Fridge || station === InteractType.Stock ? 'bg-blue-100/50' :
                'bg-gray-100/50';

    return (
        <div className={`flex items-center gap-1 ${station ? stationBg : 'bg-white/50'} rounded-lg px-1.5 py-1`}>
            <img
                src={iconUrl}
                alt={def?.name || 'Unknown'}
                title={def?.name}
                className={`${sizeClass} object-contain rounded-full bg-white/90 border border-gray-200 shadow-sm`}
                onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
            />
            {station && <StationIcon type={station} size={14} />}
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
            className={`bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 rounded-lg shadow-md p-2 flex flex-col gap-1 w-full ${
                timeInfo.isUrgent ? 'border-2 border-red-500' : ''
            } ${timeInfo.isExpired ? 'opacity-60' : ''}`}
        >
            {/* En-tête : Icône du plat */}
            <div className="flex justify-center">
                <img
                    src={finalIconUrl}
                    alt={finalRecipe.name}
                    className="w-8 h-8 object-contain rounded-full bg-white/90 border border-gray-200 shadow-sm"
                    onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
                />
            </div>

            {/* Ingrédients à traiter */}
            <div className="flex flex-wrap gap-1 justify-center">
                {processedInfo.ingredientsToProcess.slice(0, 4).map((proc, index) => (
                    <IngredientIcon
                        key={`${order.id}-proc-${index}`}
                        ingredient={proc.ingredient}
                        sizeClass="w-6 h-6"
                        station={proc.station}
                    />
                ))}
                {processedInfo.ingredientsToProcess.length > 4 && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/90 border border-gray-200 text-xs text-gray-600">
            +{processedInfo.ingredientsToProcess.length - 4}
          </span>
                )}
                {processedInfo.ingredientsToProcess.length === 0 && processedInfo.allBaseIngredients.slice(0, 4).map((ingredient, index) => (
                    <IngredientIcon
                        key={`${order.id}-base-${index}`}
                        ingredient={ingredient}
                        sizeClass="w-6 h-6"
                    />
                ))}
            </div>

            {/* Assemblage final */}
            {processedInfo.finalAssemblyStation && processedInfo.finalAssemblyIngredients.length > 0 && (
                <div className="flex items-center gap-1 justify-center bg-gray-100/50 rounded-md px-2 py-1">
                    <StationIcon type={processedInfo.finalAssemblyStation} size={16} />
                    {processedInfo.finalAssemblyIngredients.slice(0, 3).map((ingredient, index) => (
                        <IngredientIcon
                            key={`${order.id}-final-${index}`}
                            ingredient={ingredient}
                            sizeClass="w-5 h-5"
                        />
                    ))}
                </div>
            )}

            {/* Barre de progression */}
            {timeInfo.totalTime > 0 && (
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${timeInfo.isUrgent ? 'bg-red-500' : 'bg-green-500'} transition-all duration-1000`}
                        style={{ width: `${timeInfo.timePercentage}%` }}
                    />
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
        <div className="fixed top-4 right-2 z-10 w-52 max-h-[calc(100vh-8rem)] overflow-y-auto p-2.5 bg-black/40 backdrop-blur-sm rounded-lg shadow-lg">
            <h3 className="text-center font-semibold text-white/90 text-sm mb-2">Orders</h3>
            <div className="flex flex-col gap-1.5">
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