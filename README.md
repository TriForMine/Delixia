# Delixia

## Description

**Delixia** est un jeu de cuisine multijoueur inspiré du style **Overcooked**, dans lequel les joueurs doivent gérer des
commandes à toute vitesse. Vous évoluez sur plusieurs cartes, dont une **cuisine japonaise** dotée d’un **portail
féérique** par lequel arrivent de drôles de slimes affamés. Votre mission ? Prendre et préparer leurs commandes
rapidement, sous peine de les voir repartir si vous tardez trop !

Développé avec **Babylon.js**, **React**, et **uWs avec Bun**, **Delixia** se veut à la fois dynamique et accessible.
Ici, pas de plateformes ou d’éléments trop fantaisistes en dehors du portail magique : le cœur du jeu repose avant tout
sur la rapidité et la coordination en cuisine, le tout dans une ambiance conviviale.

## Mécaniques de jeu principales

1. **Prise de commandes** : Cliquez sur les slimes (qui apparaissent via le portail féérique) pour prendre leurs
   commandes.
2. **Préparation des plats** : Assemblez les ingrédients selon la recette demandée, le plus vite possible.
3. **Service rapide** : Servez les plats finis avant que les clients ne s’impatientent.
4. **Gestion du temps** : À mesure que le nombre de slimes augmente, optimisez vos déplacements et vos priorités.

## Cartes disponibles

- **Cuisine japonaise (avec son portail féérique)** : Préparez des sushis, des ramens, et autres spécialités nippones
  tout en surveillant l’arrivée constante de slimes via le portail magique.

*(D’autres cartes viendront s’ajouter au fil des mises à jour.)*

## Assets et inspirations

Les assets (modèles 3D, textures, sons, etc.) proviennent de différentes sources **libres de droits** trouvées en ligne.
Nous tenons à remercier ces créateurs qui partagent leurs ressources gratuitement ou sous licence ouverte, permettant de
donner vie à **Delixia** dans un style visuel unique.

Pour ce qui est du gameplay, **Delixia** s’inspire fortement de la série *Overcooked*, mêlant coopération effrénée,
hiérarchisation des tâches et convivialité.

## Implémentation technique et développement

1. **Structure de projet**
    - **Babylon.js** pour la 3D et les interactions.
    - **React** pour l’interface (menus, HUD).
    - **uWs avec Bun** + **Colyseus** pour la partie multijoueur et la synchronisation en temps réel.

2. **Étapes de réalisation**
    - **Conception initiale** : Choix des mécaniques de cuisine et de la thématique (portail féérique, slimes, cuisine
      japonaise).
    - **Développement** : Mise en place du moteur de jeu 3D et de la logique serveur/client.
    - **Intégration des assets** : Import des modèles et animations libres de droits, configuration des shaders, etc.
    - **Test et itération** : Ajustement de la difficulté, de la vitesse de service et du comportement des slimes.
    - **Optimisation** : Amélioration des performances réseau et de l’interface utilisateur.

3. **Technologies utilisées**  
   | Technologie | Usage |
   |----------------------|----------------------------------------------------------|
   | **Babylon.js**       | Moteur 3D pour les décors et les interactions |
   | **React & Tailwind** | Interface utilisateur (menus, HUD)                       |
   | **uWs avec Bun**     | Serveur hautes performances pour le multijoueur |
   | **Colyseus**         | Synchronisation en temps réel des parties |
   | **Assets libres**    | Modèles 3D, textures, sons issus de sites de ressources |

## Installation et Exécution

### Prérequis

- Bun
- Un navigateur compatible WebGL/WebGPU

### Installation

```sh
# Cloner le dépôt
git clone https://github.com/TriForMine/delixia.git
cd delixia

# Installer les dépendances
bun install
```

### Lancer le jeu

```sh
bun run dev
```

Rendez-vous sur `http://localhost:5173` dans votre navigateur pour commencer à jouer.

## Remerciements

Un grand merci aux créateurs d’assets libres de droits et à la communauté **Babylon.js**, dont le soutien et les
ressources ont permis de donner vie à **Delixia**.

---

**Delixia** vous attend : préparez vos ustensiles, enfilez votre tablier et montrez vos talents de chef pour satisfaire
la horde de slimes ! Bon jeu et bonne cuisine ! 🍣✨