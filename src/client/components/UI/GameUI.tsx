import Orders from "./Orders";

export default function GameUI({ onBackToMenu }: { onBackToMenu: () => void }) {
    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <button
                onClick={onBackToMenu}
                className="absolute top-4 left-4 btn-dream pointer-events-auto flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Main menu
            </button>
            <Orders />
        </div>
    );
}
