# Delixia 🍣

![](https://github.com/TriForMine/Delixia/blob/master/public/logo.png)

## 📖 Description

**Delixia** is an online multiplayer cooking game inspired by the *Overcooked* series. You play as a chef who must take incoming orders, prepare the required dishes, and serve them quickly at designated service points, all while cooperating with other players connected via a **dedicated server**. The game currently takes place in a **Japanese-themed kitchen**.

<p align="center">
  <a href="https://delixia.pages.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Play%20on-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflarepages" alt="Play on Cloudflare Pages">
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://delixia.triformine.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Play%20on-Triformine%20Dev-blue?style=for-the-badge" alt="Play on Triformine Dev">
  </a>
</p>

## 🎮 Core Gameplay Mechanics

1.  **Order Management**: Orders (various sushi types like Onigiri, Nigiri, Rolls 🍙🍣) appear in the UI. Prepare and serve them before their timer runs out! Orders are assigned to specific customer seats (chairs).
2.  **Ingredient Procurement**: Grab base ingredients (Rice, Nori, Salmon, Ebi, Sea Urchin) from designated Stock points.
3.  **Food Preparation**:
    *   **Processing**: Some ingredients need processing (e.g., Rice in the Oven becomes Cooked Rice). This takes time and is handled by the server.
    *   **Combining**: Combine ingredients on a Chopping Board according to recipes (e.g., Cooked Rice + Nori = Onigiri).
4.  **Plating & Serving**:
    *   Place the final dish onto a Plate (obtained from a Plate Stock).
    *   Finished dishes can be placed on Serving Boards (with or without a plate first).
    *   Deliver the plated dish to the correct customer seat (chair) associated with the order to complete it and score points.
5.  **Trash**: Dispose of unwanted ingredients or plates in the Trash bin.
6.  **Teamwork & Time**: The game is timed ⏱️. Coordinate efficiently with other players to maximize your score before the server timer runs out. The final score is displayed at the end.

## 🗺️ Available Map

*   **Japanese Kitchen**: Prepare **Onigiri**, **Ebi Nigiri**, **Salmon Nigiri**, and **Sea Urchin Rolls** in a vibrant, multi-level Japanese-style kitchen environment.

## ✨ Assets and Inspirations

Assets (3D models, textures, sounds, etc.) are sourced from **royalty-free** providers. A big thank you to all creators who share their resources. The concept of **Delixia** is heavily inspired by *Overcooked*, focusing on online cooperation and fast-paced gameplay in a friendly atmosphere.

---

## 🔧 Detailed Technical Implementation

The game utilizes a client-server architecture for real-time online multiplayer gameplay.

### Overall Architecture

```mermaid
graph LR
    subgraph Client ["Client (Browser)"]
        UI[React UI (Orders, Timer, Score)]
        Engine[Babylon.js Engine]
        LocalChar[Local Character Controller]
        RemoteChar[Remote Character Controller]
        NetworkClient[Colyseus Client]
        Physics["Havok Physics"]
        MapLoad[Map Loader & Config]
        AudioMgr[Audio Manager]

        UI -- interacts --> Engine & LocalChar
        LocalChar -- controls --> Engine & Physics
        RemoteChar -- replicates state --> Engine
        LocalChar -- sends inputs --> NetworkClient
        NetworkClient -- receives state --> UI & RemoteChar
        Engine -- uses --> Physics
        Engine -- uses --> MapLoad
        Engine -- uses --> AudioMgr
    end

    subgraph Server ["Server (Dedicated - Bun)"]
        ColyseusServer["Colyseus Server Core"]
        GameRoomLogic["GameRoom (State & Logic)"]
        WebSockets["@colyseus/bun-websockets"]
        ServerMapLoad["Server Map Loader & Config"]
        InteractionSvc["Interaction Service"]
        RecipeSvc["Recipe Service"]
        OrderSvc["Order Service"]
        TimerSvc["Game Timer Service"]

        ColyseusServer -- manages --> GameRoomLogic
        GameRoomLogic -- contains --> InteractionSvc & RecipeSvc & OrderSvc & TimerSvc
        GameRoomLogic -- defines logic --> ColyseusServer
        ColyseusServer -- uses --> WebSockets
        GameRoomLogic -- uses --> ServerMapLoad
    end

    NetworkClient -- "WebSocket Connection" --> WebSockets
```

### 3D Engine & Physics (Babylon.js - Client-Side)

*   **3D Rendering**: Powered by Babylon.js. Attempts to use **WebGPU** if available, falling back to **WebGL** for broader compatibility.
*   **Asset Instantiation**: Map objects (walls, counters) are loaded once and **instantiated** (`MapLoader.ts`) for optimized rendering performance and memory usage. Ingredient models are also loaded once and cloned (`IngredientLoader.ts`).
*   **Physics**: **Havok Physics** engine integrated client-side for collisions, character movement, and jumping. The `LocalCharacterController` handles its movement based on physics contacts and ground checks (`checkSupport`, shape casting).
*   **Shadows**: Optimized `CascadedShadowGenerator` for a cartoonish style and good performance, managed by `PerformanceManager`.
*   **Environment**: Skybox and `ReflectionProbe` for Image-Based Lighting (IBL).
*   **Loading**: Custom loading screen (`CustomLoadingScreen` in `BabylonScene.tsx`) displays progress using `AssetsManager`.
*   **Audio**: `AudioManager` utilizing Babylon.js Audio Engine v2 for sound effects, including spatial audio for footsteps and interactions.

### Networking & Multiplayer (Colyseus - Client & Server)

*   **Server**: Dedicated **Colyseus** server running on **Bun** (`@colyseus/bun-websockets`) for high I/O performance. Hosts game rooms (`delixia-server.triformine.dev`).
    *   **Dev Tools**: Includes **Playground** (`http://localhost:2567`) and **Monitor** (`http://localhost:2567/monitor`, login `admin:admin`) for local development debugging and supervision.
*   **State Synchronization**: Uses Colyseus `Schema` (`GameRoomState`, `Player`, `InteractableObjectState`, `Order`) for real-time state sync between server and clients.
*   **Room Management**: Features a lobby (`LobbyRoom`) and game rooms (`GameRoom`) with real-time listing, allowing players to join existing games or create new ones (`RoomList.tsx`).
*   **Communication**: WebSocket messages for actions (movement, interaction). Custom hooks (`use-colyseus.ts`, `colyseus.ts`) simplify client-side integration and handle reconnection logic.
*   **Client-Side Smoothing**: `RemoteCharacterController` uses interpolation and simple velocity prediction to mitigate network latency effects for smooth remote player movement.
*   **Network Throttling**: Client sends updates at a variable rate (throttled based on movement/time thresholds) to reduce network traffic (`GameEngine.ts`). Server broadcasts state changes efficiently via Schema diffing.

### Game Logic & Gameplay (Server-Authoritative)

*   **Character Controllers (Client)**:
    *   `LocalCharacterController`: Handles player input, camera control (`ArcRotateCamera`), local physics interactions, footstep sounds, and character visibility fading when the camera is too close.
    *   `RemoteCharacterController`: Replicates server state (position, rotation, animation, held items) using interpolation. Also plays spatial footstep sounds based on replicated state.
*   **Input Management (Client)**: `InputManager` manages canvas focus and pointer lock. Keyboard inputs are mapped to actions (`LocalCharacterController`).
*   **Animations (Client)**: Smooth blending between character states (`CharacterState`) managed in `CharacterController`.
*   **Interaction System**:
    *   Client (`LocalCharacterController`) detects the nearest interactable object (optimized via `SpatialGrid`).
    *   On interaction key press, client sends an `interact` message to the server (`GameEngine.ts`).
    *   Server (`InteractionService.ts`) validates the interaction based on game state (player inventory, object state, recipe logic).
    *   If valid, the server updates the `GameRoomState`.
    *   The updated state is automatically broadcast to all clients via Colyseus Schema sync.
    *   Clients update visuals based on the new state (UI, item appearances, object states).

    ```mermaid
    sequenceDiagram
        participant Player
        participant Client (LocalController)
        participant Client (GameEngine)
        participant Server (GameRoom/InteractionService)
        participant All Clients

        Player->>Client (LocalController): Press 'E' near Object
        Client (LocalController)->>Client (GameEngine): tryInteract() finds nearest object (SpatialGrid)
        Client (GameEngine)->>Server (GameRoom/InteractionService): Send 'interact' { objectId }
        Server (GameRoom/InteractionService)->>Server (GameRoom/InteractionService): Validate Interaction (Player State, Object State, Recipe Logic)
        alt Interaction Valid
            Server (GameRoom/InteractionService)->>Server (GameRoom/InteractionService): Modify GameRoomState (e.g., player.holdedIngredient, object.ingredientsOnBoard)
            Server (GameRoom/InteractionService)-->>All Clients: Broadcast updated GameRoomState (Schema diff)
            All Clients->>All Clients: Apply state changes (Update UI, Character visuals, Object visuals)
        else Interaction Invalid
            Server (GameRoom/InteractionService)-->>Client (GameEngine): Send specific error message (e.g., 'alreadyCarrying')
            Client (GameEngine)->>Client (GameEngine): Play error sound
        end
    ```

*   **Recipe & Cooking Logic (Server)**: `RecipeService.ts` handles ingredient combination checks, recipe completion (instant or timed processing), and managing timed station states (like the Oven). Recipes defined in `shared/recipes.ts`.
*   **Order & Score Management (Server)**: `OrderService.ts` generates new orders, assigns them to available chairs, manages their deadlines, handles serving attempts, and updates the score. `GameTimerService.ts` manages the overall round timer and triggers game end.
*   **Item System (Shared)**: Definitions for ingredients and plates in `shared/items.ts`, including visual properties (`shared/visualConfigs.ts`).
*   **Customers (Client/Server)**: Server assigns orders to specific `ServingOrder` interactable IDs (chairs). Client (`GameEngine`) spawns/despawns visual customer models (chick/chicken) at the chair locations based on active orders and displays a 3D UI element showing the ordered item and remaining time.

### Map Configuration and Loading

*   **Shared Definition**: Map layout and interactable properties defined in `shared/maps/japan.ts` using the `MapModelConfig` structure.
*   **Deterministic IDs & Hash**: Interaction IDs are automatically generated (`mapUtils.ts`) based on type, ingredient, and index to ensure consistency. A SHA-256 hash of the map configuration is calculated (`generateMapHash`) for client/server version verification.
    ```mermaid
     graph TD
        A["Shared Config File (.ts)"] --> B("Process Config (mapUtils)");
        B -- "Generate IDs" --> C{"Config with IDs"};
        C -- "Calculate Hash" --> D["Map Hash (SHA-256)"];

        subgraph Server ["Server Side"]
            E["Server Map Loader"] --> F{"Load Config + Generate IDs"};
            F --> G["Store Map Hash<br>Create InteractableObjectStates"];
        end

        subgraph Client ["Client Side"]
            H["Client Map Loader"] --> I{"Load Config + Generate IDs"};
            I --> J["Calculate Client Map Hash"];
            J --> K{"Compare Hashes"};
            K -- Match --> L["Load 3D Models<br>Create Client InteractableObjects"];
            K -- Mismatch --> M["Show Warning Alert"];
        end

        A --> E;
        A --> H;
        G -- "state.mapHash" --> K;
    ```
*   **Server Loading**: The `GameRoom` initializes `InteractableObjectState` based on the processed configuration via `ServerMapLoader`.
*   **Client Loading**: The `MapLoader` loads 3D models (using instantiation), creates client-side `InteractableObject` instances, and verifies the map hash against the one received from the server state.

### User Interface (UI - Client)

*   **Framework**: React (v19 experimental compiler enabled), TailwindCSS, DaisyUI.
*   **Client State Management**: Zustand (`useStore`) for global application state (e.g., app mode: menu, game, roomList).
*   **Colyseus Integration**: Custom hooks (`useGameColyseusState`, `useLobbyRooms`, etc.) connect React components to the Colyseus room state for dynamic updates. Handles connection status and errors.
*   **UI Components**: Dynamic display of game info (Timer, Orders, Score) synchronized with Colyseus state. Includes a `GameEndScreen` and a `RoomList` component. Custom loading screen integrated with Babylon.js.

### Notable Optimizations

*   **Rendering**: Mesh instancing, optimized shadows (`CascadedShadowGenerator`), hardware scaling, frustum culling, character visibility fade.
*   **Networking**: Throttled client updates, efficient server state diffing (Colyseus Schema).
*   **Interaction Detection**: `SpatialGrid` for proximity checks, caching nearest interactable.
*   **Physics & Movement**: Pre-allocation of `Vector3`/`Quaternion` objects, optimized shape casting for ground checks/collisions. Physics aggregate configuration for character stability.
*   **Audio**: Pooling particle textures (`InteractableObject`), centralized sound loading (`AudioManager`).

### Tooling & Environment

*   **Bundler**: Rsbuild.
*   **Runtime**: Bun.
*   **Language**: TypeScript (v5.x).
*   **Formatting/Linting**: Biome.
*   **Containerization**: Dockerfile for the server.
*   **CI/CD & Deployment**: GitHub Actions workflow for client build/deployment (GitHub Pages & Cloudflare Pages); server deployment via Docker Compose on a dedicated server (managed outside the repository).

---

## 🚀 Installation and Running (for Development)

### Prerequisites

*   **Bun** (Mandatory) - ([Installation Instructions](https://bun.sh/docs/installation))
*   Modern browser with WebGL/WebGPU support (Chrome, Firefox, Edge recommended)

### Install Dependencies

```sh
git clone https://github.com/TriForMine/delixia.git
cd delixia
bun install
```

### Run Local Development Environment

Execute the following command in the project root:

```sh
bun run dev
```

This command concurrently starts:
1.  The **Client Development Server** (Rsbuild, typically on `http://localhost:3000`).
2.  The **Colyseus Game Server** in watch mode (on `ws://localhost:2567`).

Once started:

*   ✅ Open `http://localhost:3000` in your browser to play the game.
*   ⚙️ Access Colyseus development tools:
    *   **Playground** at `http://localhost:2567` (Interact with game rooms).
    *   **Monitor** at `http://localhost:2567/monitor` (Login: `admin`, Password: `admin`) (Monitor server activity).

---

## 🙏 Acknowledgements

A huge thank you to the **Babylon.js** community and creators of royalty-free assets for their resources and support. Special thanks to the **Colyseus** team for their invaluable help and responsiveness in resolving several issues encountered during development.

---

**Delixia** awaits! Grab your utensils, put on your apron, and show everyone who's the top chef! Enjoy the game and happy cooking! ✨