import type React from 'react'
import { useCallback } from 'react'
import { motion } from 'motion/react'
import { useStore } from '@client/store/useStore'
import { ArrowLeft, Play } from 'lucide-react' // Importe des icônes si besoin

// Définit la structure pour un élément du tutoriel
interface TutorialItem {
  imageSrc: string // Chemin vers ton image (dans /public/tuto/ par exemple)
  description: string
}

// TODO: Remplis ce tableau avec tes images et descriptions
const tutorialItems: TutorialItem[] = [
  { imageSrc: '/tuto/step1_move.png', description: 'Utilise ZQSD (ou WASD) pour te déplacer dans la cuisine.' },
  { imageSrc: '/tuto/step2_interact.png', description: 'Appuie sur E pour interagir avec les objets (prendre, poser, utiliser).' },
  { imageSrc: '/tuto/step3_orders.png', description: 'Consulte les commandes en haut à droite et prépare les plats demandés.' },
  { imageSrc: '/tuto/step4_stations.png', description: 'Utilise les différentes stations (four, planche) pour transformer les ingrédients.' },
  { imageSrc: '/tuto/step5_serve.png', description: 'Place le plat final sur une assiette et sers-le au bon client !' },
  // Ajoute autant d'étapes que nécessaire
]

const TutorialPage: React.FC = () => {
  const setMode = useStore((state) => state.setMode)

  // Fonction pour passer à la page suivante (liste des salons)
  const handleContinue = useCallback(() => {
    setMode('roomList')
  }, [setMode])

  // Fonction pour revenir au menu principal
  const handleBackToMenu = useCallback(() => {
    setMode('menu')
  }, [setMode])

  return (
    <motion.div
      key="tutorial-page"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-base-200 bg-opacity-95 flex flex-col items-center justify-center z-10 pointer-events-auto p-4 md:p-6"
    >
      <div className="bg-base-100 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-3xl text-base-content relative border border-secondary/20 flex flex-col">
        {/* Bouton Retour */}
        <button
          onClick={handleBackToMenu}
          className="absolute top-3 left-3 btn btn-ghost btn-sm btn-circle z-10 hover:bg-base-content/10"
          aria-label="Retour au Menu"
        >
          <ArrowLeft className="text-secondary" size={24} strokeWidth={2.5} />
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
          Comment Jouer ?
        </h2>

        {/* Conteneur scrollable pour le contenu du tuto */}
        <div className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar max-h-[65vh]">
          {tutorialItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 bg-base-200/50 p-3 rounded-lg border border-base-300"
            >
              {/* TODO: Assure-toi que les chemins d'images sont corrects et que les images existent dans /public/tuto/ */}
              <img
                src={item.imageSrc}
                alt={`Tutoriel étape ${index + 1}`}
                className="w-32 h-32 object-contain rounded-md flex-shrink-0 border bg-base-100"
                // Ajoute une image placeholder en cas d'erreur
                onError={(e) => (e.currentTarget.src = '/icons/placeholder.png')}
              />
              <p className="text-base-content/90 text-center sm:text-left text-md">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Bouton Continuer */}
        <div className="mt-6 text-center">
          <button onClick={handleContinue} className="btn-dream flex items-center justify-center gap-2 mx-auto">
            <Play size={20} strokeWidth={2.5} /> Compris, allons jouer !
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default TutorialPage
