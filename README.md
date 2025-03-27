# Delixia 🍣

![](https://github.com/TriForMine/Delixia/blob/master/public/logo.png)

## Description

**Delixia** est un jeu de cuisine multijoueur inspiré de la série **Overcooked**. Vous y incarnez un(e) chef qui doit
prendre, préparer et servir des plats à des slimes affamés. Le tout se déroule dans plusieurs cuisines, dont une
**cuisine japonaise** reliée à un **portail féérique**… Gare à l’affluence !

## Mécaniques de jeu principales

1. **Prise de commandes** : Allez à la rencontre des slimes et récupérez leurs commandes.
2. **Préparation des plats** : Assemblez les ingrédients le plus vite possible.
3. **Service express** : Servez votre plat à temps avant que les slimes ne s’impatientent.
4. **Gestion du temps** : À mesure que la difficulté augmente, organisez vos priorités et coordonnez-vous avec les autres
   joueurs.

## Cartes disponibles

- **Cuisine japonaise (avec portail féérique)** : Réalisez sushis, ramens et autres délices nippons tout en surveillant
  l’arrivée constante de slimes.  
  *(D’autres cartes feront leur apparition dans de futures mises à jour.)*

## Assets et inspirations

Les assets (modèles 3D, textures, sons…) proviennent de sources **libres de droits**, et nous remercions chaleureusement
tous les créateurs qui partagent leurs ressources. Le concept de **Delixia** s’inspire fortement de *Overcooked*, avec
un accent sur la coopération et la rapidité au sein d’une ambiance conviviale.

## Implémentation technique

- **Babylon.js** pour la 3D  
- **React** (avec **Tailwind**) pour l’interface minimaliste  
- **Colyseus** (intégré à **Bun**) pour la partie multijoueur et la synchronisation en temps réel  

## Installation et exécution

### Prérequis

- **Bun** (obligatoire)  
  > Nous utilisons un serveur Colyseus tournant sur Bun pour bénéficier de meilleures performances.  
  > Cela signifie toutefois que le code **ne fonctionne pas** avec Node.js.

- **Navigateur** compatible WebGL/WebGPU

### Installation

```sh
git clone https://github.com/TriForMine/delixia.git
cd delixia
bun install
```

### Lancer le jeu

```sh
bun run dev
```

Ouvrez la page `http://localhost:5173` dans votre navigateur pour commencer à jouer !

## Remerciements

Un grand merci à la communauté **Babylon.js** et aux créateurs d’assets libres de droits pour leurs ressources et leur
soutien.

---

**Delixia** n’attend plus que vous : préparez vos ustensiles, enfilez votre tablier et montrez à ces slimes qui est le
meilleur chef ! Bon jeu et bonne cuisine ✨!
