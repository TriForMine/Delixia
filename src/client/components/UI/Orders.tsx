import React from "react";
import { useGameColyseusState } from "@client/hooks/colyseus";
import { RECIPES } from "@shared/recipes";
import type { Order } from "@shared/schemas/Order.ts";
import { Ingredient, InteractType } from "@shared/types/enums";
import { Flame } from "lucide-react";

interface IngredientWithStatus {
    iconUrl: string;
    needsCooking: boolean;
    keySuffix: string;
}

const extractIngredientsWithStatus = (recipe: typeof RECIPES[0]): IngredientWithStatus[] => {
    const allIngredients: IngredientWithStatus[] = [];

    recipe.steps.forEach((step, stepIndex) => {
        if (step.ingredients) {
            step.ingredients.forEach(({ ingredient, quantity }, ingredientIndex) => {
                const iconUrl = `/ingredients/${Ingredient[ingredient].toLowerCase()}.png`;
                const needsCooking = step.machine === InteractType.Oven;

                for (let i = 0; i < quantity; i++) {
                    allIngredients.push({
                        iconUrl,
                        needsCooking,
                        keySuffix: `${stepIndex}-${ingredientIndex}-${i}`
                    });
                }
            });
        }
    });

    return allIngredients;
};


interface OrderCardProps {
    order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    const ingredients = recipe ? extractIngredientsWithStatus(recipe) : [];

    if (!recipe) {
        return (
            <div className="bg-red-200 rounded-lg shadow-md p-2 w-full text-red-800 text-xs">
                Error: Recipe not found for order {order.id}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 rounded-lg shadow-md px-2.5 py-2 w-full flex items-center gap-3 transition-all duration-300">
            <div className="flex-shrink-0">
                <div className="w-11 h-11 bg-white rounded-md overflow-hidden flex items-center justify-center shadow">
                    <img
                        src={`/icons/${recipe.name.toLowerCase()}.png`}
                        alt={recipe.name}
                        className="object-contain w-9 h-9"
                        onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
                    />
                </div>
            </div>

            <div className="flex-grow flex flex-col gap-1 min-w-0">
                {ingredients.length > 0 ? (
                    <div className="flex flex-wrap gap-2 items-center">
                        {ingredients.map((ingredientData) => (
                            <div
                                key={`ingredient-${ingredientData.keySuffix}-${ingredientData.iconUrl}`}
                                className="relative flex-shrink-0" // position: relative pour la flamme
                            >
                                <img
                                    src={ingredientData.iconUrl}
                                    alt={ingredientData.needsCooking ? "Ingredient to cook" : "Ingredient"}
                                    className="w-9 h-9 object-contain bg-white/50 rounded-sm p-0.5"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                {ingredientData.needsCooking && (
                                    <Flame
                                        className="w-4 h-4 absolute -bottom-1 -right-1 drop-shadow animate-pulse text-orange-500"
                                        strokeWidth={2.5}
                                        fill="currentColor"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-gray-600 italic">
                        No ingredients required?
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Orders() {
    const orders = useGameColyseusState((state) => state.orders);

    return (
        <div className="fixed top-2 right-2 z-10 w-64 max-h-[60vh] overflow-y-auto p-2 bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg space-y-2">
            {orders?.map((order) => (
                <OrderCard key={order.id} order={order} />
            ))}
            {(!orders || orders.length === 0) && (
                <p className="text-center text-gray-300 text-xs italic py-4">No pending orders</p>
            )}
        </div>
    );
}