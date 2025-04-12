// src/client/game/InteractableObject.ts
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh, MeshBuilder } from '@babylonjs/core/Meshes'
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import type { Scene } from '@babylonjs/core/scene'
import { Ingredient, InteractType } from '@shared/types/enums.ts'
import type { IngredientLoader } from '@client/game/IngredientLoader.ts'
import { getItemDefinition } from "@shared/definitions.ts"; // Ensure this import exists

export class InteractableObject {
  private isActive: boolean = false

  // Static texture cache for sharing textures between instances
  private static promptTextures: Map<string, DynamicTexture> = new Map<string, DynamicTexture>()
  // Static particle texture cache
  private static particleTextures: Map<string, Texture> = new Map<string, Texture>()

  public mesh: Mesh
  public interactionDistance = 2.5

  private readonly promptDisc: Mesh
  private readonly scene: Scene
  private readonly billboardOffset: Vector3
  readonly interactType: InteractType
  public id: number
  private sparkleSystem?: ParticleSystem
  private readonly ingredientLoader?: IngredientLoader
  private displayedIngredients: Mesh[] = []
  // Store the last known ingredients to detect changes
  private lastIngredientsOnBoard: Ingredient[] = [];


  // Pre-allocated vector for position updates
  private _positionUpdateTemp: Vector3 = new Vector3()

  constructor(
      mesh: Mesh,
      scene: Scene,
      interactType: InteractType,
      interactId: number,
      billboardOffset?: Vector3,
      keyPrompt: string = 'E',
      ingredientLoader?: IngredientLoader,
  ) {
    this.mesh = mesh
    this.scene = scene
    this.billboardOffset = billboardOffset?.clone() ?? new Vector3(0, 2, 0)
    this.ingredientLoader = ingredientLoader

    // 1) Create a disc with reduced tessellation for better performance
    this.promptDisc = MeshBuilder.CreateDisc(`${mesh.name}_prompt_disc`, { radius: 0.25, tessellation: 16 }, scene)
    this.promptDisc.billboardMode = Mesh.BILLBOARDMODE_ALL

    // 2) Use a shared texture manager for prompt textures
    // This allows reusing textures for the same key prompt

    // Only create a new texture if one doesn't already exist for this key
    let dynamicTexture: DynamicTexture
    if (InteractableObject.promptTextures.has(keyPrompt)) {
      dynamicTexture = InteractableObject.promptTextures.get(keyPrompt)!
    } else {
      // Create a new texture with smaller dimensions
      dynamicTexture = new DynamicTexture(`prompt_texture_${keyPrompt}`, { width: 64, height: 64 }, scene)
      const ctx = dynamicTexture.getContext() as CanvasRenderingContext2D
      ctx.clearRect(0, 0, 64, 64) // Clear background
      ctx.fillStyle = '#FF9999' // Pastel pink
      ctx.font = 'bold 32px "Patrick Hand"' // Readable font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(keyPrompt.toUpperCase(), 32, 32) // Centered text
      dynamicTexture.update()

      // Store for reuse
      InteractableObject.promptTextures.set(keyPrompt, dynamicTexture)
    }

    // Matériau doux et rêveur
    const mat = new StandardMaterial('promptMat', scene)
    mat.diffuseTexture = dynamicTexture
    mat.emissiveColor = new Color3(1, 0.9, 0.95) // Rose pastel lumineux
    mat.diffuseColor = new Color3(1, 0.98, 1) // Fond presque blanc
    mat.useAlphaFromDiffuseTexture = true
    mat.alpha = 0.8 // Légère transparence
    mat.disableLighting = true
    this.promptDisc.material = mat

    // Cacher par défaut
    this.promptDisc.setEnabled(false)
    this.promptDisc.isPickable = false

    // make it always in front
    this.promptDisc.renderingGroupId = 1

    // 3) Animation flottante douce - optimized to use pre-allocated vector
    this.scene.onBeforeRenderObservable.add(() => {
      // Only update position when prompt is visible for performance
      if (this.promptDisc.isEnabled()) {
        // Use pre-allocated vector to avoid creating new objects every frame
        this._positionUpdateTemp.copyFrom(this.mesh.getAbsolutePosition())
        this._positionUpdateTemp.addInPlace(this.billboardOffset)
        this._positionUpdateTemp.y += Math.sin(Date.now() * 0.0015) * 0.15 // Gentle floating effect
        this.promptDisc.setAbsolutePosition(this._positionUpdateTemp)
      }
    })

    // 4) Effet "dream world" pastel
    this.createSparkleEffect()

    this.interactType = interactType
    this.id = interactId
  }

  /**
   * Resets all static properties of the InteractableObject class.
   * This should be called when reloading the map to prevent issues with cached resources.
   */
  public static reset(): void {
    // Clear prompt textures
    this.promptTextures.forEach((texture) => {
      texture.dispose()
    })
    this.promptTextures.clear()

    // Clear particle textures
    this.particleTextures.forEach((texture) => {
      texture.dispose()
    })
    this.particleTextures.clear()
  }


  /**
   * Create optimized sparkle effect with reduced particle count
   */
  private createSparkleEffect() {
    this.sparkleSystem = new ParticleSystem(
        `${this.mesh.name}_sparkles`,
        15, // Reduced from 30 to 15 particles
        this.scene,
    )

    this.sparkleSystem.disposeOnStop = true

    // Use the prompt disc as emitter (it moves with the object)
    this.sparkleSystem.emitter = this.promptDisc // Use the moving disc

    // Reuse Vector3 instances for emit boxes
    const minEmitBox = new Vector3(-0.1, -0.1, -0.1)
    const maxEmitBox = new Vector3(0.1, 0.1, 0.1)
    this.sparkleSystem.minEmitBox = minEmitBox
    this.sparkleSystem.maxEmitBox = maxEmitBox

    // Pastel colors
    this.sparkleSystem.color1 = new Color4(1, 0.85, 0.9, 0.6) // Pale pink
    this.sparkleSystem.color2 = new Color4(0.85, 0.9, 1, 0.6) // Pastel blue
    this.sparkleSystem.colorDead = new Color4(0, 0, 0, 0)

    // Reduced particle size and lifetime for better performance
    this.sparkleSystem.minSize = 0.02
    this.sparkleSystem.maxSize = 0.06
    this.sparkleSystem.minLifeTime = 1.0 // Reduced from 1.5
    this.sparkleSystem.maxLifeTime = 2.0 // Reduced from 3
    this.sparkleSystem.emitRate = 5 // Reduced from 8
    this.sparkleSystem.blendMode = ParticleSystem.BLENDMODE_ADD

    // Reuse Vector3 for gravity
    this.sparkleSystem.gravity = new Vector3(0, -0.02, 0)

    // Reuse Vector3 for directions
    const direction1 = new Vector3(-0.15, 0.3, -0.15)
    const direction2 = new Vector3(0.15, 0.6, 0.15)
    this.sparkleSystem.direction1 = direction1
    this.sparkleSystem.direction2 = direction2

    this.sparkleSystem.minEmitPower = 0.03
    this.sparkleSystem.maxEmitPower = 0.08
    this.sparkleSystem.updateSpeed = 0.02

    // Optimize for performance
    this.sparkleSystem.preWarmCycles = 0
    this.sparkleSystem.disposeOnStop = false // Allow reuse
    this.sparkleSystem.stop(); // Start stopped
  }

  private disabled: boolean = false

  public setDisabled(disabled: boolean): void {
    this.disabled = disabled
    if (disabled) {
      this.showPrompt(false)
    }
  }

  public isDisabled(): boolean {
    return this.disabled
  }

  public showPrompt(show: boolean): void {
    // Don't show prompt if object is disabled
    if (this.disabled) {
      show = false
    }

    // Prevent showing prompt if the object is currently active (e.g., oven is on)
    if (this.isActive) {
      show = false;
    }

    // Only change state if needed
    if (this.promptDisc.isEnabled() !== show) {
      this.promptDisc.setEnabled(show);
      if (this.sparkleSystem) {
        if (show) this.sparkleSystem.start();
        else this.sparkleSystem.stop();
      }
    }
  }

  public activate(): void {
    if (this.isActive) return; // Already active
    this.isActive = true;
    this.showPrompt(false); // Hide prompt when active

    switch (this.interactType) {
      case InteractType.Oven: {
        // --- Oven Particle Effect Logic (unchanged) ---
        let fireTexture: Texture;
        const texturePath = 'assets/particles/Star-Texture.png';
        if (InteractableObject.particleTextures.has(texturePath)) {
          fireTexture = InteractableObject.particleTextures.get(texturePath)!;
        } else {
          fireTexture = new Texture(texturePath, this.scene);
          fireTexture.hasAlpha = true;
          InteractableObject.particleTextures.set(texturePath, fireTexture);
        }

        const fire = new ParticleSystem('fire', 600, this.scene);
        fire.particleTexture = fireTexture;
        const firePosition = new Vector3();
        firePosition.copyFrom(this.mesh.getAbsolutePosition());
        firePosition.y += 1;
        fire.emitter = firePosition;
        const minEmitBox = new Vector3(-0.35, 0, -0.35);
        const maxEmitBox = new Vector3(0.35, 0.2, 0.35);
        fire.minEmitBox = minEmitBox;
        fire.maxEmitBox = maxEmitBox;
        fire.color1 = new Color4(0.6, 0.4, 0.9, 0.8);
        fire.color2 = new Color4(0.4, 0.7, 0.9, 0.8);
        fire.colorDead = new Color4(0.2, 0.1, 0.3, 0);
        fire.addColorGradient(0, new Color4(0.6, 0.4, 0.9, 0.6));
        fire.addColorGradient(0.3, new Color4(0.7, 0.5, 0.9, 0.7));
        fire.addColorGradient(0.6, new Color4(0.4, 0.7, 0.9, 0.5));
        fire.addColorGradient(1.0, new Color4(0.2, 0.5, 0.8, 0));
        fire.minSize = 0.02;
        fire.maxSize = 0.12;
        fire.minLifeTime = 0.2;
        fire.maxLifeTime = 0.6;
        fire.addSizeGradient(0, 0.02);
        fire.addSizeGradient(0.2, 0.08);
        fire.addSizeGradient(0.4, 0.04);
        fire.addSizeGradient(0.6, 0.1);
        fire.addSizeGradient(0.8, 0.06);
        fire.addSizeGradient(1.0, 0.01);
        fire.emitRate = 150;
        fire.blendMode = ParticleSystem.BLENDMODE_ADD;
        fire.minInitialRotation = 0;
        fire.maxInitialRotation = Math.PI * 2;
        const gravity = new Vector3(0, -2, 0);
        fire.gravity = gravity;
        const direction1 = new Vector3(-0.3, 2, -0.3);
        const direction2 = new Vector3(0.3, 3, 0.3);
        fire.direction1 = direction1;
        fire.direction2 = direction2;
        fire.minAngularSpeed = -Math.PI * 1.5;
        fire.maxAngularSpeed = Math.PI * 1.5;
        fire.minEmitPower = 0.05;
        fire.maxEmitPower = 0.2;
        fire.updateSpeed = 0.01;
        fire.disposeOnStop = false;

        let smokeTexture: Texture;
        const smokeTexturePath = 'assets/particles/ExplosionTexture-Smoke-1.png';
        if (InteractableObject.particleTextures.has(smokeTexturePath)) {
          smokeTexture = InteractableObject.particleTextures.get(smokeTexturePath)!;
        } else {
          smokeTexture = new Texture(smokeTexturePath, this.scene);
          smokeTexture.hasAlpha = true;
          InteractableObject.particleTextures.set(smokeTexturePath, smokeTexture);
        }
        const smoke = new ParticleSystem('smoke', 200, this.scene);
        smoke.particleTexture = smokeTexture;
        smoke.emitter = firePosition;
        smoke.minEmitBox = new Vector3(-0.4, 0.1, -0.4);
        smoke.maxEmitBox = new Vector3(0.4, 0.3, 0.4);
        smoke.color1 = new Color4(0.4, 0.4, 0.5, 0.2);
        smoke.color2 = new Color4(0.2, 0.2, 0.3, 0.2);
        smoke.colorDead = new Color4(0.1, 0.1, 0.1, 0);
        smoke.addColorGradient(0, new Color4(0.4, 0.4, 0.6, 0.0));
        smoke.addColorGradient(0.1, new Color4(0.3, 0.3, 0.4, 0.2));
        smoke.addColorGradient(0.6, new Color4(0.2, 0.2, 0.25, 0.15));
        smoke.addColorGradient(1.0, new Color4(0.1, 0.1, 0.1, 0));
        smoke.minSize = 0.3;
        smoke.maxSize = 0.7;
        smoke.minLifeTime = 0.5;
        smoke.maxLifeTime = 1.2;
        smoke.addSizeGradient(0, 0.2);
        smoke.addSizeGradient(0.3, 0.5);
        smoke.addSizeGradient(0.7, 0.7);
        smoke.addSizeGradient(1.0, 0.9);
        smoke.emitRate = 30;
        smoke.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        smoke.minInitialRotation = 0;
        smoke.maxInitialRotation = Math.PI * 2;
        smoke.minAngularSpeed = -0.5;
        smoke.maxAngularSpeed = 0.5;
        smoke.gravity = new Vector3(0, -1, 0);
        smoke.direction1 = new Vector3(-0.2, 1, -0.2);
        smoke.direction2 = new Vector3(0.2, 1.5, 0.2);
        smoke.minEmitPower = 0.1;
        smoke.maxEmitPower = 0.3;
        smoke.updateSpeed = 0.01;
        smoke.disposeOnStop = false;

        fire.start();
        smoke.start();

        // Store these systems to stop them later in deactivate()
        this.activeParticleSystems.push(fire, smoke);
      }
        break;
    }
  }

  // Store active particle systems to stop them correctly
  private activeParticleSystems: ParticleSystem[] = [];

  public deactivate(): void {
    if (!this.isActive) return; // Already inactive
    this.isActive = false;

    // Stop any active particle systems
    this.activeParticleSystems.forEach(system => {
      system.stop();
    });
    this.activeParticleSystems = [];
  }

  public interact(): void {
    // Don't allow interaction if object is disabled
    if (this.disabled && !this.isActive) {
      return
    }
  }

  public updateIngredientsOnBoard(ingredients: Ingredient[]): void {
    // Detect if a *result* ingredient just appeared
    const justGotResult = ingredients.length > 0 &&
        getItemDefinition(ingredients[0])?.isResult && // Check if the first/only item is a result
        !this.lastIngredientsOnBoard.some(ing => getItemDefinition(ing)?.isResult); // And we didn't have a result before

    this.clearIngredientsOnBoard(); // Clear previous visuals

    if (!this.ingredientLoader) {
      console.warn("IngredientLoader not available in InteractableObject.");
      this.lastIngredientsOnBoard = [...ingredients]; // Update memory even if loader fails
      return;
    }

    ingredients.forEach((ingredientId, index) => {
      const itemDef = getItemDefinition(ingredientId);
      if (!itemDef) return; // Skip if definition not found

      const ingredientMesh = this.ingredientLoader?.getIngredientMesh(ingredientId);
      if (ingredientMesh) {
        ingredientMesh.setParent(this.mesh); // Parent to the station mesh

        // Position ingredients on top, slightly offset based on index
        // Adjust offsets as needed for your station models
        const yOffset = 0.1 + (index * 0.05); // Base height + stacking offset
        const xOffset = (ingredients.length > 1) ? (index - (ingredients.length - 1) / 2) * 0.15 : 0; // Spread out if multiple

        ingredientMesh.position = new Vector3(xOffset, yOffset, 0); // Example positioning
        ingredientMesh.scaling = new Vector3(0.5, 0.5, 0.5);
        ingredientMesh.rotationQuaternion = Quaternion.Identity();
        ingredientMesh.isPickable = false; // Usually items on board aren't directly pickable by raycast

        this.displayedIngredients.push(ingredientMesh);
      }
    });

    // Trigger craft complete effect if a result just appeared
    if (justGotResult) {
      this.playCraftCompleteEffect();
    }

    // Update the memory of ingredients
    this.lastIngredientsOnBoard = [...ingredients];
  }

  private playCraftCompleteEffect(): void {
    const capacity = 50; // Number of particles for the effect
    const effectSystem = new ParticleSystem(
        `${this.mesh.name}_craft_complete`,
        capacity,
        this.scene
    );

    // --- Configure the effect ---
    // Emitter position slightly above the station center
    const emitterPos = this.mesh.getAbsolutePosition().add(new Vector3(0, 0.3, 0)); // Adjust Y as needed
    effectSystem.emitter = emitterPos;
    effectSystem.particleEmitterType = effectSystem.createSphereEmitter(1.2)

    // Texture (using flare for sparkles)
    let flareTexture: Texture;
    const texturePath = 'assets/particles/Star-Texture.png'; // Or use Star-Texture.png
    if (InteractableObject.particleTextures.has(texturePath)) {
      flareTexture = InteractableObject.particleTextures.get(texturePath)!;
    } else {
      flareTexture = new Texture(texturePath, this.scene);
      flareTexture.hasAlpha = true;
      InteractableObject.particleTextures.set(texturePath, flareTexture);
    }
    effectSystem.particleTexture = flareTexture;

    // Colors (Bright and celebratory)
    effectSystem.color1 = new Color4(1.0, 1.0, 0.5, 1.0); // Yellow
    effectSystem.color2 = new Color4(1.0, 0.8, 0.2, 1.0); // Orange/Gold
    effectSystem.colorDead = new Color4(0, 0, 0, 0.0); // Fade out completely

    // Size
    effectSystem.minSize = 0.05;
    effectSystem.maxSize = 0.15;

    // Lifetime (Short burst)
    effectSystem.minLifeTime = 0.3;
    effectSystem.maxLifeTime = 0.8;

    // Emission (Burst)
    effectSystem.emitRate = capacity / effectSystem.maxLifeTime; // Emit all particles quickly
    effectSystem.manualEmitCount = capacity; // Ensure all particles are emitted
    effectSystem.maxEmitPower = 2;
    effectSystem.minEmitPower = 1;
    effectSystem.updateSpeed = 0.01;

    // Shape & Movement
    effectSystem.gravity = new Vector3(0, -3.0, 0); // Slight downward pull
    effectSystem.direction1 = new Vector3(-1, 2, -1); // Upward and outward burst
    effectSystem.direction2 = new Vector3(1, 4, 1);

    // Blending
    effectSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    // Start & Schedule Stop/Return
    effectSystem.start();
    setTimeout(() => {
      if (effectSystem) { // Check if system still exists
        effectSystem.stop();
      }
    }, (effectSystem.maxLifeTime + 0.2) * 1000); // Stop slightly after max lifetime
  }


  public clearIngredientsOnBoard(): void {
    // Dispose all displayed ingredients
    this.displayedIngredients.forEach((mesh) => {
      mesh.dispose()
    })
    this.displayedIngredients = []
  }

  public dispose(): void {
    this.deactivate(); // Ensure active effects are stopped/returned
    this.clearIngredientsOnBoard(); // Ensure displayed items are removed
    this.promptDisc.dispose();

    console.log(`InteractableObject ${this.id} disposed`);
  }
}