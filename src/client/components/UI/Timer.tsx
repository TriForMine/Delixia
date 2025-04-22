import { useGameColyseusState } from '@client/hooks/colyseus.ts'
import { Clock } from 'lucide-react' // Changed from TimerIcon to Clock as per your last code

export default function Timer() {
  const timeLeft = useGameColyseusState((state) => state.timeLeft) ?? 0
  const isUrgent = timeLeft <= 10000

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)

  const displayMinutes = Math.max(0, minutes)
  const displaySeconds = Math.max(0, seconds)
  const formattedTime = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`

  const baseContainerClasses =
    'rounded-full shadow-lg px-4 py-1 w-fit absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none transition-colors duration-300 ease-in-out'
  const normalBgClasses = 'bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100'
  const urgentBgClasses = 'bg-gradient-to-br from-red-400 via-orange-300 to-yellow-200'

  const baseTextClasses = 'text-2xl font-md transition-colors duration-300 ease-in-out'
  const normalTextClasses = 'text-gray-800'
  const urgentTextClasses = 'text-red-700 font-extrabold'

  const baseIconClasses = 'inline-block h-5 w-5 mr-2 transition-colors duration-300 ease-in-out'
  const normalIconClasses = 'text-gray-800'
  const urgentIconClasses = 'text-red-700'

  const animationClass = isUrgent ? 'animate-pulse' : ''

  return (
    <div className={`${baseContainerClasses} ${isUrgent ? urgentBgClasses : normalBgClasses} ${animationClass}`}>
      <div className="flex items-center justify-center">
        <Clock strokeWidth={4} className={`${baseIconClasses} ${isUrgent ? urgentIconClasses : normalIconClasses}`} />
        <span className={`${baseTextClasses} ${isUrgent ? urgentTextClasses : normalTextClasses}`}>{formattedTime}</span>
      </div>
    </div>
  )
}
