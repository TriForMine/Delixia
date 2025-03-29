import React from "react";
import { useGameColyseusState } from "@client/hooks/colyseus";
import { RECIPES } from "@shared/recipes";
import type { Order } from "@shared/schemas/Order.ts";
import { Ingredient } from "@shared/types/enums";

// Fonction utilitaire pour extraire les ingrédients d'une recette
const extractIngredients = (recipe: typeof RECIPES[0]): string[] => {
    const ingredients: string[] = [];
    recipe.steps.forEach((step) => {
        if (step.ingredients) {
            step.ingredients.forEach(({ ingredient, quantity }) => {
                // Utilisation de l'enum pour obtenir le nom (ex: Ingredient[ingredient])
                ingredients.push(`${quantity} x ${Ingredient[ingredient]}`);
            });
        }
    });
    return ingredients;
};

interface OrderCardProps {
    order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    // Recherche de la recette correspondante au recipeId
    const recipe = RECIPES.find((r) => r.id === order.recipeId);

    // Extraction de la liste d'ingrédients depuis les étapes (si disponibles)
    const ingredientsList = recipe ? extractIngredients(recipe) : [];

    // Utilisation d'une image de remplacement si la recette ne définit pas d'imageUrl
    const imageUrl = (recipe as any)?.imageUrl || "https://dummyimage.com/48";

    return (
        <div className="bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 rounded-xl shadow-lg p-3 flex flex-col gap-2 transition-all duration-300">
            {/* En-tête : image et infos du plat */}
            <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-md overflow-hidden flex items-center justify-center">
                    <img
                        src={imageUrl}
                        alt={recipe ? recipe.name : "Unknown Dish"}
                        className="object-cover w-full h-full"
                    />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-gray-800">
                        {recipe ? recipe.name : "Unknown Dish"}
                    </h2>
                    <p className="text-xs text-gray-600">ID: {order.id}</p>
                </div>
            </div>

            {/* Liste des ingrédients */}
            <div>
                <h3 className="text-xs font-semibold text-gray-700">Ingredients:</h3>
                <ul className="list-disc list-inside text-xs text-gray-600">
                    {ingredientsList.length > 0 ? (
                        ingredientsList.map((ing, idx) => <li key={idx}>{ing}</li>)
                    ) : (
                        <li>None</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default function Orders() {
    // Récupère l'état des commandes depuis Colyseus
    const orders = useGameColyseusState((state) => state.orders);

    return (
        // Overlay discret en haut à droite, adapté pour une UI dans un jeu 3D
            <div className="fixed top-4 right-4 w-64 max-h-[80vh] overflow-y-auto p-3 bg-opacity-75 rounded-lg shadow-lg space-y-2">
                {orders?.map((order) => (
                    <OrderCard key={order.id} order={order}  />
                ))}
            </div>
    );
}
