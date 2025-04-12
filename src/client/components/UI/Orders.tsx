import React, { useState, useEffect, useMemo } from "react";
import { useGameColyseusState } from "@client/hooks/colyseus";
import { getItemDefinition, getRecipeDefinition } from "@shared/definitions";
import type { Order } from "@shared/schemas/Order.ts";
import { InteractType } from "@shared/types/enums";
import { Flame, Slice, ChefHat, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface OrderCardProps {
    order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    const recipe = getRecipeDefinition(order.recipeId);
    const [timeInfo, setTimeInfo] = useState(() => calculateTimeInfo(order));

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

    const ingredientElements = useMemo(() => {
        if (!recipe) return null;
        return recipe.requiredIngredients.length > 0 ? (
            recipe.requiredIngredients.map(({ ingredient, quantity }, index) => {
                const ingredientDef = getItemDefinition(ingredient);
                const ingredientIconUrl = ingredientDef?.icon ? `/ingredients/${ingredientDef.icon}.png` : '/icons/placeholder.png';
                return Array.from({ length: quantity }).map((_, i) => (
                    <div key={`req-${order.id}-${ingredient}-${index}-${i}`} className="relative flex-shrink-0" title={ingredientDef?.name ?? 'Unknown'}>
                        <img
                            src={ingredientIconUrl}
                            alt={ingredientDef?.name ?? 'Ingredient'}
                            className="w-7 h-7 object-contain bg-white/60 rounded-sm p-0.5"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        {recipe.stationType === InteractType.Oven && (
                            <Flame className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-orange-500 drop-shadow" fill="currentColor" strokeWidth={1.5} />
                        )}
                        {recipe.stationType === InteractType.ChoppingBoard && (
                            <Slice className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-green-600 drop-shadow" fill="currentColor" strokeWidth={1.5} />
                        )}
                    </div>
                ));
            })
        ) : ( <div className="text-xs text-gray-600 italic">Recipe error?</div> );
    }, [recipe, order.id]);

    if (!recipe) {
        return (
            <div className="bg-red-200 rounded-lg shadow-md p-2 w-full text-red-800 text-xs">
                Error: Recipe definition not found for ID {order.recipeId}
            </div>
        );
    }

    const resultItemDef = getItemDefinition(recipe.result.ingredient);
    const resultIconUrl = resultItemDef?.icon ? `/icons/${resultItemDef.icon}.png` : '/icons/placeholder.png';

    return (
        <div className={`bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 rounded-lg shadow-md px-2.5 py-2 w-full flex flex-col gap-2 transition-colors duration-300 ${timeInfo.isUrgent ? 'animate-pulse' : ''} ${timeInfo.isExpired ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <div className="w-11 h-11 bg-white rounded-md overflow-hidden flex items-center justify-center shadow">
                        <img src={resultIconUrl} alt={recipe.name} className="object-contain w-9 h-9" onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')} />
                    </div>
                </div>
                <div className="flex-grow flex flex-wrap gap-1 items-center min-w-0">
                    {ingredientElements}
                </div>
            </div>
            {timeInfo.totalTime > 0 && (
                <div className="flex items-center gap-2 w-full">
                    <div className={`flex-grow bg-gray-200/50 rounded-full h-2`}>
                        <div
                            className={`h-full rounded-full ${timeInfo.isUrgent ? 'bg-red-500' : 'bg-green-500'} ${timeInfo.isExpired ? 'bg-gray-400' : ''}`}
                            style={{ width: `${timeInfo.timePercentage}%`, transition: 'width 0.5s linear' }}
                        ></div>
                    </div>
                    <div className={`flex items-center flex-shrink-0 text-xs font-medium ${timeInfo.isUrgent ? 'text-red-700 font-bold' : 'text-gray-700'} ${timeInfo.isExpired ? 'text-gray-500 line-through' : ''}`}>
                        <Clock size={12} className="mr-0.5"/>
                        <span>{timeInfo.formattedTimeLeft}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Orders() {
    const orders = useGameColyseusState((state) => state.orders);

    const sortedOrders = useMemo(() => {
        if (!orders || orders.length === 0) return [];
        return [...orders].sort((a, b) => {
            const aExpired = a.deadline > 0 && a.deadline <= Date.now();
            const bExpired = b.deadline > 0 && b.deadline <= Date.now();
            if (aExpired && !bExpired) return 1;
            if (!aExpired && bExpired) return -1;
            return (a.deadline || Infinity) - (b.deadline || Infinity);
        });
    }, [orders]);

    return (
        <div className="fixed top-4 right-2 z-10 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden p-2 bg-black/30 backdrop-blur-sm rounded-lg shadow-lg flex flex-col">
            <h3 className="text-center font-semibold text-white/90 text-sm mb-1 flex items-center justify-center gap-1 flex-shrink-0"><ChefHat size={16} /> Orders</h3>

            <div className="flex flex-col">
                <AnimatePresence initial={false} mode="wait">
                    {sortedOrders.length > 0 ? (
                        <motion.div
                            key="order-list"
                            className="flex flex-col"
                        >
                            {sortedOrders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 30, scale: 0.8, height: 0, marginBottom: 0, transition: { duration: 0.2, marginBottom: { delay: 0.2 } } }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className={`flex-shrink-0 ${index < sortedOrders.length - 1 ? 'mb-2' : ''}`}
                                    style={{ originX: 1 }}
                                >
                                    <OrderCard order={order} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="no-orders"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { delay: 0.1 } }}
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        >
                            <p className="text-center text-gray-300/70 text-xs italic py-4">No pending orders</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}