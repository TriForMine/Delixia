import HeldItemUI from './HeldItemUI'
import Orders from './Orders'
import Score from './Score'
import Timer from './Timer'
import { ArrowLeft } from 'lucide-react'

export default function GameUI({ onBackToMenu }: { onBackToMenu: () => void }) {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <button onClick={onBackToMenu} className="absolute top-3 left-3 btn-dream-small pointer-events-auto flex items-center gap-2">
        <ArrowLeft className="h-6 w-5" strokeWidth={4} />
        Main menu
      </button>

      <HeldItemUI />
      <Timer />
      <Orders />
      <Score />
    </div>
  )
}
