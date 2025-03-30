import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial'
import {Color3, Color4} from '@babylonjs/core/Maths/math.color'
import {Vector3} from '@babylonjs/core/Maths/math.vector'
import {Mesh, MeshBuilder} from '@babylonjs/core/Meshes'
import {ParticleSystem} from '@babylonjs/core/Particles/particleSystem'
import {Texture} from '@babylonjs/core/Materials/Textures/texture'
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture'
import type {Scene} from '@babylonjs/core/scene'
import {Ingredient, InteractType} from '@shared/types/enums.ts'
import type {LocalCharacterController} from '@client/game/LocalCharacterController.ts'
import type {IngredientLoader} from '@client/game/IngredientLoader.ts'

export class InteractableObject {
  // Static texture cache for sharing textures between instances
  private static promptTextures: Map<string, DynamicTexture> = new Map<string, DynamicTexture>();
  // Static particle texture cache
  private static particleTextures: Map<string, Texture> = new Map<string, Texture>();
  // Particle system pool for reuse
  private static particleSystemPool: ParticleSystem[] = [];

  /**
   * Resets all static properties of the InteractableObject class.
   * This should be called when reloading the map to prevent issues with cached resources.
   */
  public static reset(): void {
    // Clear prompt textures
    this.promptTextures.forEach((texture) => {
      texture.dispose();
    });
    this.promptTextures.clear();

    // Clear particle textures
    this.particleTextures.forEach((texture) => {
      texture.dispose();
    });
    this.particleTextures.clear();

    // Dispose and clear particle system pool
    this.particleSystemPool.forEach((system) => {
      system.dispose();
    });
    this.particleSystemPool = [];
  }

  public mesh: Mesh;
  public interactionDistance = 2.5;

  private readonly promptDisc: Mesh;
  private readonly scene: Scene;
  private readonly billboardOffset: Vector3;
  readonly interactType: InteractType;
  private readonly ingredientType: Ingredient;
  public id: number;
  private sparkleSystem?: ParticleSystem;
  private ingredientLoader?: IngredientLoader;
  private displayedIngredients: Mesh[] = [];

  // Pre-allocated vector for position updates
  private _positionUpdateTemp: Vector3 = new Vector3();

  constructor(
      mesh: Mesh,
      scene: Scene,
      interactType: InteractType,
      ingredientType: Ingredient,
      interactId: number,
      billboardOffset?: Vector3,
      keyPrompt: string = 'E',
      ingredientLoader?: IngredientLoader
  ) {
    this.mesh = mesh
    this.scene = scene
    this.billboardOffset = billboardOffset?.clone() ?? new Vector3(0, 2, 0)
    this.ingredientLoader = ingredientLoader

    // 1) Create a disc with reduced tessellation for better performance
    this.promptDisc = MeshBuilder.CreateDisc(`${mesh.name}_prompt_disc`, { radius: 0.25, tessellation: 16 }, scene);
    this.promptDisc.billboardMode = Mesh.BILLBOARDMODE_ALL;

    // 2) Use a shared texture manager for prompt textures
    // This allows reusing textures for the same key prompt

    // Only create a new texture if one doesn't already exist for this key
    let dynamicTexture: DynamicTexture;
    if (InteractableObject.promptTextures.has(keyPrompt)) {
      dynamicTexture = InteractableObject.promptTextures.get(keyPrompt)!;
    } else {
      // Create a new texture with smaller dimensions
      dynamicTexture = new DynamicTexture(`prompt_texture_${keyPrompt}`, { width: 64, height: 64 }, scene);
      const ctx = dynamicTexture.getContext() as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, 64, 64); // Clear background
      ctx.fillStyle = '#FF9999'; // Pastel pink
      ctx.font = 'bold 32px "Patrick Hand"'; // Readable font
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(keyPrompt.toUpperCase(), 32, 32); // Centered text
      dynamicTexture.update();

      // Store for reuse
      InteractableObject.promptTextures.set(keyPrompt, dynamicTexture);
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
        this._positionUpdateTemp.copyFrom(this.mesh.getAbsolutePosition());
        this._positionUpdateTemp.addInPlace(this.billboardOffset);
        this._positionUpdateTemp.y += Math.sin(Date.now() * 0.0015) * 0.15; // Gentle floating effect
        this.promptDisc.setAbsolutePosition(this._positionUpdateTemp);
      }
    });

    // 4) Effet "dream world" pastel
    this.createSparkleEffect()

    this.interactType = interactType
    this.ingredientType = ingredientType
    this.id = interactId
  }

  /**
   * Get a particle system from the pool or create a new one
   */
  private static getParticleSystem(name: string, capacity: number, scene: Scene): ParticleSystem {
    // Check if we have a system in the pool
    if (this.particleSystemPool.length > 0) {
      const system = this.particleSystemPool.pop()!;
      system.name = name;
      return system;
    }

    // Create a new system if none available in pool
    return new ParticleSystem(name, capacity, scene);
  }

  /**
   * Return a particle system to the pool for reuse
   */
  private static returnParticleSystemToPool(system: ParticleSystem): void {
    system.stop();
    system.reset();
    this.particleSystemPool.push(system);
  }

  /**
   * Create optimized sparkle effect with reduced particle count
   */
  private createSparkleEffect() {
    // Use pooled particle system with reduced capacity
    this.sparkleSystem = InteractableObject.getParticleSystem(
      `${this.mesh.name}_sparkles`, 
      15, // Reduced from 30 to 15 particles
      this.scene
    );

    this.sparkleSystem.emitter = this.promptDisc;

    // Reuse Vector3 instances for emit boxes
    const minEmitBox = new Vector3(-0.1, -0.1, -0.1);
    const maxEmitBox = new Vector3(0.1, 0.1, 0.1);
    this.sparkleSystem.minEmitBox = minEmitBox;
    this.sparkleSystem.maxEmitBox = maxEmitBox;

    // Pastel colors
    this.sparkleSystem.color1 = new Color4(1, 0.85, 0.9, 0.6); // Pale pink
    this.sparkleSystem.color2 = new Color4(0.85, 0.9, 1, 0.6); // Pastel blue
    this.sparkleSystem.colorDead = new Color4(0, 0, 0, 0);

    // Reduced particle size and lifetime for better performance
    this.sparkleSystem.minSize = 0.02;
    this.sparkleSystem.maxSize = 0.06;
    this.sparkleSystem.minLifeTime = 1.0; // Reduced from 1.5
    this.sparkleSystem.maxLifeTime = 2.0; // Reduced from 3
    this.sparkleSystem.emitRate = 5; // Reduced from 8
    this.sparkleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    // Reuse Vector3 for gravity
    this.sparkleSystem.gravity = new Vector3(0, -0.02, 0);

    // Reuse Vector3 for directions
    const direction1 = new Vector3(-0.15, 0.3, -0.15);
    const direction2 = new Vector3(0.15, 0.6, 0.15);
    this.sparkleSystem.direction1 = direction1;
    this.sparkleSystem.direction2 = direction2;

    this.sparkleSystem.minEmitPower = 0.03;
    this.sparkleSystem.maxEmitPower = 0.08;
    this.sparkleSystem.updateSpeed = 0.02;

    // Optimize for performance
    this.sparkleSystem.preWarmCycles = 0;
    this.sparkleSystem.disposeOnStop = false; // Allow reuse
  }

  public showPrompt(show: boolean): void {
    this.promptDisc.setEnabled(show)
    if (this.sparkleSystem) {
      if (show) this.sparkleSystem.start()
      else this.sparkleSystem.stop()
    }
  }

  public activate(start: number, character?: LocalCharacterController): void {
    switch (this.interactType) {
      case InteractType.Oven:
        // Particle texture cache is initialized at class definition

        // Get or create fire texture - using Star-Texture for better flame appearance
        let fireTexture: Texture;
        const texturePath = 'assets/particles/Star-Texture.png';
        if (InteractableObject.particleTextures.has(texturePath)) {
          fireTexture = InteractableObject.particleTextures.get(texturePath)!;
        } else {
          fireTexture = new Texture(texturePath, this.scene);
          fireTexture.hasAlpha = true;
          InteractableObject.particleTextures.set(texturePath, fireTexture);
        }

        // Get a particle system from the pool with increased capacity for denser gas furnace fire
        const fire = InteractableObject.getParticleSystem('fire', 600, this.scene); // Increased from 400 to 600 for denser gas furnace fire
        fire.particleTexture = fireTexture;

        // Get emitter position and adjust to be at the top of the oven
        // Create a new Vector3 instance specifically for the fire emitter to prevent it from being affected by other code
        const firePosition = new Vector3();
        firePosition.copyFrom(this.mesh.getAbsolutePosition());
        // Add Y-offset to position the fire at the top of the oven (position + size/2)
        firePosition.y += 1; // Increased offset to ensure fire appears at the top of the oven
        fire.emitter = firePosition;

        // Create an emission box for gas furnace flame - wider at base, taller for more vertical flame
        const minEmitBox = new Vector3(-0.35, 0, -0.35); // Wider in X and Z for gas burner shape
        const maxEmitBox = new Vector3(0.35, 0.2, 0.35); // Taller in Y for more vertical gas flame
        fire.minEmitBox = minEmitBox;
        fire.maxEmitBox = maxEmitBox;

        // Colors - fantasy/dreamland color scheme with pastels and ethereal tones
        fire.color1 = new Color4(0.6, 0.4, 0.9, 0.8); // Soft purple base
        fire.color2 = new Color4(0.4, 0.7, 0.9, 0.8); // Dreamy blue tips
        fire.colorDead = new Color4(0.2, 0.1, 0.3, 0); // Faint purple glow as it fades

        // Add color gradient over lifetime for fantasy/dreamland appearance
        fire.addColorGradient(0, new Color4(0.6, 0.4, 0.9, 0.6)); // Start with soft purple, more transparent
        fire.addColorGradient(0.3, new Color4(0.7, 0.5, 0.9, 0.7)); // Transition to lavender
        fire.addColorGradient(0.6, new Color4(0.4, 0.7, 0.9, 0.5)); // Shift to dreamy blue
        fire.addColorGradient(1.0, new Color4(0.2, 0.5, 0.8, 0)); // Fade to transparent blue

        // Smaller particles for fantasy/dreamland star effect
        fire.minSize = 0.02; // Much smaller min size for delicate stars
        fire.maxSize = 0.12; // Smaller max size for delicate stars
        fire.minLifeTime = 0.2; // Slightly longer minimum for dreamy effect
        fire.maxLifeTime = 0.6; // Longer maximum for dreamy effect

        // Add size gradients for magical twinkling effect
        fire.addSizeGradient(0, 0.02); // Start very small
        fire.addSizeGradient(0.2, 0.08); // Quick growth
        fire.addSizeGradient(0.4, 0.04); // First twinkle - shrink
        fire.addSizeGradient(0.6, 0.1); // Second twinkle - grow
        fire.addSizeGradient(0.8, 0.06); // Third twinkle - shrink
        fire.addSizeGradient(1.0, 0.01); // End very small
        fire.emitRate = 150; // Increased for more numerous tiny stars
        fire.blendMode = ParticleSystem.BLENDMODE_ADD; // ADD blending for ethereal glow effect

        // Enable particle rotation for magical twinkling effect
        fire.minInitialRotation = 0;
        fire.maxInitialRotation = Math.PI * 2; // Random initial rotation

        // Reduced gravity for floating, dreamy effect
        const gravity = new Vector3(0, -2, 0); // Much lighter gravity for floating stars
        fire.gravity = gravity;

        // Gentle, swirling direction for fantasy/dreamland effect
        const direction1 = new Vector3(-0.3, 2, -0.3); // Gentler upward movement with slight spread
        const direction2 = new Vector3(0.3, 3, 0.3); // Gentler upward movement with slight spread
        fire.direction1 = direction1;
        fire.direction2 = direction2;

        // Enhanced rotation for twinkling, magical effect
        fire.minAngularSpeed = -Math.PI * 1.5; // Faster rotation for twinkling
        fire.maxAngularSpeed = Math.PI * 1.5; // Faster rotation for twinkling
        fire.minEmitPower = 0.05; // Very gentle emission for dreamy floating
        fire.maxEmitPower = 0.2; // Very gentle emission for dreamy floating
        fire.updateSpeed = 0.01; // Slower updates for dreamier effect

        // Optimize for performance
        fire.disposeOnStop = false; // Allow reuse

        // Create a second particle system for smoke effect
        let smokeTexture: Texture;
        const smokeTexturePath = 'assets/particles/ExplosionTexture-Smoke-1.png';
        if (InteractableObject.particleTextures.has(smokeTexturePath)) {
          smokeTexture = InteractableObject.particleTextures.get(smokeTexturePath)!;
        } else {
          smokeTexture = new Texture(smokeTexturePath, this.scene);
          smokeTexture.hasAlpha = true;
          InteractableObject.particleTextures.set(smokeTexturePath, smokeTexture);
        }

        const smoke = InteractableObject.getParticleSystem('smoke', 200, this.scene);
        smoke.particleTexture = smokeTexture;

        // Use the same emitter position as the fire
        smoke.emitter = firePosition;

        // Wider emission box for smoke
        smoke.minEmitBox = new Vector3(-0.4, 0.1, -0.4);
        smoke.maxEmitBox = new Vector3(0.4, 0.3, 0.4);

        // Smoke colors - grayish with blue tint
        smoke.color1 = new Color4(0.4, 0.4, 0.5, 0.2);
        smoke.color2 = new Color4(0.2, 0.2, 0.3, 0.2);
        smoke.colorDead = new Color4(0.1, 0.1, 0.1, 0);

        // Add color gradient for more realistic smoke appearance
        smoke.addColorGradient(0, new Color4(0.4, 0.4, 0.6, 0.0)); // Start transparent
        smoke.addColorGradient(0.1, new Color4(0.3, 0.3, 0.4, 0.2)); // Become visible
        smoke.addColorGradient(0.6, new Color4(0.2, 0.2, 0.25, 0.15)); // Darker as it rises
        smoke.addColorGradient(1.0, new Color4(0.1, 0.1, 0.1, 0)); // Fade out

        // Larger, slower smoke particles
        smoke.minSize = 0.3;
        smoke.maxSize = 0.7;
        smoke.minLifeTime = 0.5;
        smoke.maxLifeTime = 1.2;

        // Add size gradients for more realistic smoke appearance
        smoke.addSizeGradient(0, 0.2); // Start small
        smoke.addSizeGradient(0.3, 0.5); // Grow as it rises
        smoke.addSizeGradient(0.7, 0.7); // Continue growing
        smoke.addSizeGradient(1.0, 0.9); // Largest at the end
        smoke.emitRate = 30;
        smoke.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        // Enable rotation for smoke
        smoke.minInitialRotation = 0;
        smoke.maxInitialRotation = Math.PI * 2;
        smoke.minAngularSpeed = -0.5;
        smoke.maxAngularSpeed = 0.5;

        // Less gravity for smoke to rise
        smoke.gravity = new Vector3(0, -1, 0);

        // Slower upward movement
        smoke.direction1 = new Vector3(-0.2, 1, -0.2);
        smoke.direction2 = new Vector3(0.2, 1.5, 0.2);

        smoke.minEmitPower = 0.1;
        smoke.maxEmitPower = 0.3;
        smoke.updateSpeed = 0.01;

        // Start both particle systems
        fire.start();
        smoke.start();

        // Return both to pool after use
        const remainingTime = 5000 - (Date.now() - start);
        setTimeout(() => {
          fire.stop();
          smoke.stop();
          InteractableObject.returnParticleSystemToPool(fire);
          InteractableObject.returnParticleSystemToPool(smoke);
        }, remainingTime);
        break;

      case InteractType.Stock:
        if (character) {
          // Handle plates differently
          if (this.ingredientType === Ingredient.Plate) {
            character.pickupPlate();
            character.updatePlateMesh()
          } else {
            character.pickupIngredient(this.ingredientType);
          }
        }
        break;
      case InteractType.Trash:
        if (character) {
          // Drop ingredient if holding one
          if (character.holdedIngredient !== Ingredient.None) {
            character.dropIngredient();
          } 
          // Drop plate if holding one
          else if (character.isHoldingPlate) {
            character.dropPlate();
          }
        }
        break;
      default:
        console.warn('Unknown interact type:', this.interactType);
        break;
    }
  }

  public deactivate(): void {
    console.log('Deactivating interactable object', this.id)
  }

  public interact(character: LocalCharacterController, timestamp: number): void {
    this.activate(timestamp, character)
  }

  public updateIngredientsOnBoard(ingredients: Ingredient[]): void {
    // Clear existing ingredients
    this.clearIngredientsOnBoard();

    if (!this.ingredientLoader) return;

    // Create and position new ingredients
    ingredients.forEach((ingredient, index) => {
      const ingredientMesh = this.ingredientLoader!.getIngredientMesh(ingredient);
      ingredientMesh.parent = this.mesh;

      // Position ingredients on top of the chopping board, stacked on each other
      ingredientMesh.position = new Vector3(0, 0.1 + (index * 0.1), 0);
      ingredientMesh.scaling = new Vector3(0.5, 0.5, 0.5);

      this.displayedIngredients.push(ingredientMesh);
    });
  }

  public clearIngredientsOnBoard(): void {
    // Dispose all displayed ingredients
    this.displayedIngredients.forEach(mesh => {
      mesh.dispose();
    });
    this.displayedIngredients = [];
  }
}
