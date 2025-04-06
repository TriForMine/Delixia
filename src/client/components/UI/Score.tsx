import { useGameColyseusState } from "@client/hooks/colyseus.ts";

export default function Score() {
    const score = useGameColyseusState((state) => state.score) ?? 0;

    return (
        <div
            className="
                absolute bottom-3 left-20 transform -translate-x-1/2 z-10 pointer-events-none
                w-32 h-32
                shadow-lg
                bg-[url('../../public/icons/coin.png')]
                bg-cover
                bg-center
                bg-no-repeat
                flex items-center justify-center
                overflow-hidden
            "
        >
            <span
                className="
                    text-4xl font-bold
                    text-white
                    [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]
                "
            >
                {score.toLocaleString()}
            </span>
        </div>
    );
}