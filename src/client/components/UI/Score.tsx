import { useGameColyseusState } from "@client/hooks/colyseus.ts";
import {Euro} from "lucide-react";

export default function Score() {
    const score = useGameColyseusState((state) => state.score) ?? 0;

    return (
        // Add the animationClass here
        <div className="border border-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 rounded-full shadow-lg px-3 py-1 w-fit absolute bottom-3 left-12 transform -translate-x-1/2 z-10 pointer-events-none transition-colors duration-300 ease-in-out bg-gray-800">
            <div className="flex items-center justify-center">
                <Euro
                    strokeWidth={3}
                    className={"inline-block h-5 w-5 mr-2 transition-colors duration-300 ease-in-out text-gradient-to-br from-purple-300 via-pink-200 to-yellow-100"}
                />
                <span className="text-2xl font-bold transition-colors duration-300 ease-in-out text-gradient-to-br from-purple-300 via-pink-200 to-yellow-100">
                    {score}
                </span>
            </div>
        </div>
    );
}