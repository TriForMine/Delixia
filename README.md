# Delixia 🍣

![](https://github.com/TriForMine/Delixia/blob/master/public/logo.png)

## Description

**Delixia** est un jeu de cuisine **multijoueur en ligne** inspiré de la série **Overcooked**. Vous y incarnez un(e) chef qui doit prendre les commandes qui apparaissent, préparer les plats demandés et les servir rapidement aux points de service désignés, le tout en coopérant avec d'autres joueurs connectés via un **serveur dédié**. Le jeu se déroule actuellement dans une **cuisine japonaise**.

## Mécaniques de jeu principales

1.  **Gestion des commandes** : Les commandes (actuellement des Onigiris) apparaissent dans l'interface utilisateur. Préparez-les et servez-les avant la fin du temps imparti !
2.  **Préparation des plats** : Récupérez les ingrédients nécessaires (riz, nori) depuis les points de stockage. Combinez-les sur une planche à découper pour créer le plat final (un Onigiri). La logique de combinaison est gérée côté serveur.
3.  **Service** : Placez l'Onigiri sur une assiette (prise également depuis un stock), puis apportez l'assiette garnie au bon point de service (signalé par un nuage) pour valider la commande et marquer des points.
4.  **Gestion du temps** : Le jeu est chronométré. Soyez rapide et coordonnez-vous avec les autres joueurs pour maximiser le score avant la fin du temps imparti par le serveur.

## Carte disponible

-   **Cuisine Japonaise** : Préparez des **Onigiris** dans une cuisine de style japonais.
    *(Actuellement, seule cette carte et la recette de l'Onigiri sont implémentées. D’autres cartes et recettes pourraient faire leur apparition dans de futures mises à jour.)*

## Assets et inspirations

Les assets (modèles 3D, textures, sons…) proviennent de sources **libres de droits**, et nous remercions chaleureusement tous les créateurs qui partagent leurs ressources. Le concept de **Delixia** s’inspire fortement de *Overcooked*, avec un accent sur la coopération en ligne et la rapidité au sein d’une ambiance conviviale.

## Implémentation Technique Détaillée

Le jeu repose sur une architecture client-serveur pour permettre le jeu multijoueur en ligne en temps réel.

### Architecture Générale

```mermaid
graph LR
    subgraph "Navigateur Client (Chaque Joueur)"
        A[React UI]
        B[Babylon.js Engine]
        C[LocalCharacterController]
        D[RemoteCharacterController]
        E[Colyseus Client]
        F[Physics (Havok)]
        G[MapLoader & Config]
        A -- Interagit avec --> B
        C -- Contrôle local --> B
        D -- Réplique état --> B
        C -- Envoie Inputs --> E
        E -- Reçoit état --> A & D
        B -- Utilise --> F
        B -- Utilise --> G
    end

    subgraph "Serveur Dédié (Tourne en continu)"
        H[Colyseus Server (Bun Runtime)]
        I[GameRoom (State Management)]
        K[Bun WebSockets]
        L[ServerMapLoader & Config]
        H -- Gère --> I
        I -- Définit la logique --> H
        H -- Utilise --> K
        I -- Utilise --> L
    end

    E -- Connexion WebSocket --> K
```

### Moteur 3D & Physique (Babylon.js - Côté Client)

-   **Rendu 3D** : Utilisation de Babylon.js. Le client tente d'utiliser **WebGPU** si disponible et bascule sur **WebGL** en fallback pour une meilleure compatibilité.
-   **Physique** : Intégration du moteur physique **Havok** côté client pour les collisions et les mouvements des personnages. Le `LocalCharacterController` gère sa propre logique de mouvement/collision basée sur les contacts physiques détectés.
-   **Ombres** : Utilisation de `CascadedShadowGenerator` optimisée pour un style cartoon et de bonnes performances.
-   **Environnement** : Skybox et `ReflectionProbe` pour l'éclairage basé sur l'image (IBL).
-   **Chargement** : Écran de chargement personnalisé affichant la progression via `AssetsManager`.

### Réseau & Multijoueur (Colyseus - Client & Serveur)

-   **Serveur** : Serveur **Colyseus** tournant sur **Bun** pour de meilleures performances I/O, utilisant `@colyseus/bun-websockets`. Ce serveur tourne en continu pour héberger les parties.
    -   **Outils Dev** : Inclut le **Playground** (`http://localhost:2567`) et le **Monitor** (`http://localhost:2567/monitor`, login `admin:admin`) pour le débogage et la supervision en développement.
-   **Synchronisation d'état** : Utilisation de `Schema` Colyseus pour synchroniser l'état du jeu (`GameRoomState`, `Player`, `InteractableObjectState`, `Order`) en temps réel entre le serveur et tous les clients connectés.
-   **Gestion des Salles** : Système de lobby et de salles de jeu avec listing en temps réel, permettant aux joueurs de rejoindre des parties existantes ou d'en créer de nouvelles.
-   **Communication** : Échange de messages spécifiques via WebSocket pour les actions (mouvement, interaction).
-   **Lissage Client** : Interpolation et prédiction de vélocité simple pour les `RemoteCharacterController` afin de masquer la latence inhérente au jeu en ligne.

### Logique de Jeu & Gameplay (Principalement Côté Serveur)

-   **Contrôleurs de Personnage (Client)** : Distinction entre `LocalCharacterController` (inputs, caméra, physique locale) et `RemoteCharacterController` (réplication de l'état serveur via interpolation).
-   **Gestion des Inputs (Client)** : `InputManager` pour le focus et le pointer lock. Mapping clavier pour les actions.
-   **Animations (Client)** : Blending fluide entre les états d'animation (`CharacterState`).
-   **Système d'Interaction** : L'interaction est initiée par le client, envoyée au serveur pour validation, et l'état résultant est synchronisé à tous les joueurs. La détection de proximité côté client est optimisée via `SpatialGrid`.

    ```mermaid
    sequenceDiagram
        participant Joueur
        participant Client
        participant Serveur (GameRoom)

        Joueur->>Client: Appuie sur 'E' près d'un objet
        Client->>Client: Détecte l'objet le plus proche (SpatialGrid)
        Client->>Serveur: Envoie message 'interact' { objectId: 123 }
        Note over Serveur: Valide l'interaction (peut interagir ? état du joueur ? état de l'objet ?)
        alt Interaction Valide
            Serveur->>Serveur: Modifie GameRoomState (ex: obj.isActive = true, joueur prend ingrédient)
            Server-->>Client: Met à jour GameRoomState (broadcast Schema à tous les clients)
            Client->>Client: Reçoit l'état mis à jour
            Client->>Client: Met à jour l'affichage (ex: active effet visuel, montre ingrédient porté)
        else Interaction Invalide
            Server-->>Client: (Optionnel) Envoie message d'erreur spécifique
        end
    ```

-   **Logique de Recette/Cuisine (Serveur)** : Combinaison d'ingrédients et validation des commandes gérées côté serveur.
-   **Gestion des Commandes & Score (Serveur)** : Le serveur génère les commandes, gère leur cycle de vie et met à jour le score.

### Configuration et Chargement de la Carte

-   **Définition Partagée** : Structure de carte définie dans `@shared/maps/japan.ts` via `MapModelConfig`.
-   **IDs & Hash Déterministes** : Les IDs interactifs sont générés automatiquement et un hash SHA-256 de la configuration est calculé pour garantir la cohérence entre client et serveur.
    ```mermaid
     graph TD
        A[Fichier Config Partagé (.ts)] --> B(Process Map Config);
        B -- Génère IDs --> C{Configuration avec IDs};
        C -- Calcule Hash --> D[Map Hash SHA-256];

        subgraph Serveur
            E[ServerMapLoader] --> F{Charge Config + Génère IDs};
            F --> G[Stocke Map Hash & Crée InteractableObjectState];
        end

        subgraph Client
            H[MapLoader] --> I{Charge Config + Génère IDs};
            I --> J[Calcule Map Hash Client];
            J --> K{Compare avec Hash Serveur};
            K -- OK --> L[Charge Modèles 3D & Crée InteractableObjects];
            K -- Différent --> M[Affiche Alerte];
        end

        A --> E;
        A --> H;
        G -->|state.mapHash| K;

    ```
-   **Chargement Serveur** : La `GameRoom` initialise l'état des objets interactifs à partir de la configuration.
-   **Chargement Client** : Le `MapLoader` charge les modèles 3D et vérifie la correspondance du hash de la carte avec celui reçu du serveur.

### Interface Utilisateur (UI - Client)

-   **Framework** : React (v19), TailwindCSS, DaisyUI.
-   **Gestion d'état Client** : Zustand (`useStore`) pour l'état applicatif global.
-   **Intégration Colyseus** : Hooks personnalisés pour la connexion, la gestion d'état et la reconnexion.
-   **Composants UI** : Affichage dynamique des infos de jeu (timer, commandes, score) synchronisé avec l'état Colyseus.

### Optimisations Notables

-   **Réseau** : Throttling intelligent des mises à jour envoyées par le client ; throttle simple côté client pour la réception.
-   **Détection d'Interaction** : `SpatialGrid` et mise en cache de l'objet le plus proche.
-   **Gestion des Ressources** : Pooling de particules, cache de textures, réutilisation des conteneurs d'assets, chargement centralisé des ingrédients.
-   **Calculs Physiques & Mouvement** : Pré-allocation d'objets `Vector3`/`Quaternion`, shape casting optimisé pour la détection du sol/collisions.
-   **Rendu** : Ombres optimisées, hardware scaling, frustum culling.
-   **Physique** : Configuration `PhysicsAggregate` pour stabiliser le personnage.

### Outillage & Environnement

-   **Bundler** : Rsbuild.
-   **Serveur d'exécution** : Bun.
-   **Langage** : TypeScript (v5.x).
-   **Formatage/Linting** : Biome.
-   **Conteneurisation** : Dockerfile pour le serveur.
-   **CI/CD & Déploiement** : Workflow GitHub Actions pour le client (GitHub Pages) ; déploiement serveur via Docker Compose sur serveur dédié (hors dépôt).

## Installation et exécution

### Prérequis

-   **Bun** (obligatoire)
-   **Navigateur** compatible WebGL/WebGPU

### Installation

```sh
git clone https://github.com/TriForMine/delixia.git
cd delixia
bun install
```

### Lancer le jeu en Développement

Exécutez la commande suivante à la racine du projet :

```sh
bun run dev
```

Cette commande lance simultanément le **serveur de développement client** (Rsbuild, généralement sur `http://localhost:3000`) et le **serveur de jeu Colyseus** en mode watch (sur `ws://localhost:2567`).

Une fois démarré :

-   Ouvrez `http://localhost:3000` dans votre navigateur pour jouer.
-   Accédez aux outils Colyseus : Playground sur `http://localhost:2567` et Monitor sur `http://localhost:2567/monitor` (login: `admin`, pass: `admin`).

## Remerciements

Un grand merci à la communauté **Babylon.js** et aux créateurs d’assets libres de droits pour leurs ressources et leur soutien. Un remerciement tout particulier à l'équipe de **Colyseus** pour leur aide précieuse et leur réactivité dans la résolution de plusieurs bugs rencontrés pendant le développement de ce projet.

---

**Delixia** n’attend plus que vous : préparez vos ustensiles, enfilez votre tablier et montrez qui est le meilleur chef ! Bon jeu et bonne cuisine ✨!