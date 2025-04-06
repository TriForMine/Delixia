import { useGameColyseusState } from "@client/hooks/colyseus.ts";
import {Euro} from "lucide-react";

export default function Score() {
    const score = useGameColyseusState((state) => state.score) ?? 0;

    return (
        // Add the animationClass here
        <div className="rounded-full shadow-lg px-4 py-1 w-fit absolute top-16 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none transition-colors duration-300 ease-in-out bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100">
            <div className="flex items-center justify-center">
                <Euro
                    strokeWidth={3.5}
                    className={"inline-block h-5 w-5 mr-2 transition-colors duration-300 ease-in-out text-gray-800"}
                />
                <span className="text-lg font-bold transition-colors duration-300 ease-in-out text-gray-800">
                    {score}
                </span>
            </div>
        </div>
    );
}