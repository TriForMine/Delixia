import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh, MeshBuilder } from '@babylonjs/core/Meshes'
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import type { Observer } from '@babylonjs/core/Misc/observable'
import { Ingredient, InteractType } from '@shared/types/enums.ts'
import type { IngredientLoader } from '@client/game/IngredientLoader.ts'
import { INGREDIENT_VISUAL_CONFIG } from '@shared/visualConfigs'
import { getItemDefinition } from '@shared/items'
import {IParticleSystem, Scalar} from '@babylonjs/core'

interface DisplayedIngredientInfo {
  mesh: Mesh
  localOffset: Vector3
  localRotation: Quaternion
  localScale: Vector3
}

export class InteractableObject {
  isActive: boolean = false

  private static promptTextures: Map<string, DynamicTexture> = new Map<string, DynamicTexture>()
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

  // --- Ingredient Display Management ---
  private ingredientAnchor: TransformNode
  private displayedIngredientInfos: DisplayedIngredientInfo[] = []
  private cookingVisualInfo: DisplayedIngredientInfo | null = null
  private lastIngredientsOnBoard: Ingredient[] = []

  // --- Performance Optimizations ---
  private _positionUpdateTemp: Vector3 = new Vector3()
  private _renderObserver: Observer<Scene> | null = null

  // --- State ---
  private activeParticleSystems: ParticleSystem[] = []
  private disabled: boolean = false

  // --- Cooking Progress UI ---
  private progressBarPlane: Mesh | null = null
  private progressBarTexture: DynamicTexture | null = null
  private progressBarMaterial: StandardMaterial | null = null
  private readonly progressBarTextureWidth = 512
  private readonly progressBarTextureHeight = 64
  private readonly progressBarPlaneWidth = 0.8
  private readonly progressBarPlaneHeight = 0.15

  private isCooking: boolean = false
  private cookingStartTime: number = 0
  private cookingTotalDuration: number = 0
  private lastProgressBarUpdateTime: number = 0
  private readonly progressBarUpdateInterval: number = 150

  private dirtyPlateMesh: Mesh | null = null;
  private dirtyPlateSmokeSystem: IParticleSystem | null = null;
  private static smokeParticleTexture: Texture | null = null;

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
    this.interactType = interactType
    this.id = interactId

    // --- Ingredient Anchor Setup ---
    this.ingredientAnchor = new TransformNode(`${mesh.name}_ingredientAnchor`, scene)
    this.ingredientAnchor.setParent(this.mesh)
    this.ingredientAnchor.position = new Vector3(0, 0.1, 0)
    this.ingredientAnchor.rotationQuaternion = Quaternion.Identity()
    this.ingredientAnchor.scaling = Vector3.One()

    // 1) Create prompt disc
    this.promptDisc = MeshBuilder.CreateDisc(`${mesh.name}_prompt_disc`, { radius: 0.25, tessellation: 16 }, scene)
    this.promptDisc.billboardMode = Mesh.BILLBOARDMODE_ALL
    this.promptDisc.isPickable = false
    this.promptDisc.renderingGroupId = 1
    this.promptDisc.setEnabled(false)

    // 2) Setup prompt material
    this._setupPromptMaterial(keyPrompt)

    // 3) Setup sparkle effect
    this.createSparkleEffect()

    // 4) Setup Cooking Progress UI if it's an Oven
    if (this.interactType === InteractType.Oven) {
      this._setupHorizontalProgressBar()
    }

    if (!InteractableObject.smokeParticleTexture && scene) {
      const smokeTexturePath = 'assets/particles/ExplosionTexture-Smoke-1.png'; // ADJUST PATH if needed
      try {
        InteractableObject.smokeParticleTexture = new Texture(smokeTexturePath, scene);
        InteractableObject.smokeParticleTexture.hasAlpha = true;
      } catch (e) {
        console.error("Failed to load smoke particle texture:", e);
      }
    }

    // 5) Setup render loop for updates
    this._setupRenderObserver()
  }

  public showDirtyPlateVisual(show: boolean): void {
    if (show && !this.dirtyPlateMesh) {
      // Create Plate Mesh
      if (this.ingredientLoader) {
        this.dirtyPlateMesh = this.ingredientLoader.getIngredientMesh(Ingredient.Plate);
        if (this.dirtyPlateMesh) {
          this.dirtyPlateMesh.setParent(this.mesh); // Parent to the chair mesh

          const parentRotationY = this.mesh.rotation.y;
          const tolerance = 0.01;

          let localPosition = new Vector3(0, 0.15, -0.1); // Default if no match

          // WARNING: Prone to precision errors and only handles specific angles!
          if (Math.abs(parentRotationY) < tolerance) { // Facing default direction (e.g., positive Z)
            localPosition = new Vector3(0, 2, -4);
          } else if (Math.abs(parentRotationY - Math.PI / 2) < tolerance) { // Rotated 90 degrees right (e.g., facing positive X)
            localPosition = new Vector3(-4, 2, 0); // Now offset needs to be on X
          } else if (Math.abs(parentRotationY - Math.PI) < tolerance) { // Rotated 180 degrees (e.g., facing negative Z)
            localPosition = new Vector3(0, 2, 4); // Offset needs to be positive Z
          } else if (Math.abs(parentRotationY - (-Math.PI / 2)) < tolerance || Math.abs(parentRotationY - (3 * Math.PI / 2)) < tolerance) { // Rotated 90 degrees left (e.g., facing negative X)
            localPosition = new Vector3(4, 2, 0); // Offset needs to be positive X
          }

          this.dirtyPlateMesh.position = localPosition;
          this.dirtyPlateMesh.scaling = new Vector3(0.5 / this.mesh.scaling.x, -0.5 / this.mesh.scaling.y, 0.5 / this.mesh.scaling.z); // Scale to match chair
          this.dirtyPlateMesh.isPickable = false;
          this.dirtyPlateMesh.isVisible = true;
          this.dirtyPlateMesh.getChildMeshes().forEach(m =>{
            m.isPickable = false;
            m.isVisible = true;
          });

          // Create Smoke Effect
          this._createSmokeEffect(this.dirtyPlateMesh);
        }
      }
    } else if (!show && this.dirtyPlateMesh) {
      // Hide/Remove Plate Mesh and Smoke
      if (this.dirtyPlateSmokeSystem) {
        this.dirtyPlateSmokeSystem.stop();
        // ParticleHelper might dispose automatically, or you might need:
        // this.dirtyPlateSmokeSystem.dispose();
        this.dirtyPlateSmokeSystem = null;
      }
      if (this.dirtyPlateMesh) {
        this.dirtyPlateMesh.dispose();
        this.dirtyPlateMesh = null;
      }
    }
  }

  private _createSmokeEffect(emitterMesh: Mesh): void {
    if (this.dirtyPlateSmokeSystem) return; // Don't create if already exists

    // Simplified Smoke Effect - Adapt particle parameters as needed
    const capacity = 50;
    const smokeSystem = new ParticleSystem(`dirtySmoke_${this.id}`, capacity, this.scene);

    if (InteractableObject.smokeParticleTexture) {
      smokeSystem.particleTexture = InteractableObject.smokeParticleTexture;
    } else {
      console.warn("Smoke texture not loaded, smoke effect will not display correctly.");
      // Optionally create a fallback simple particle here
      return; // Exit if no texture
    }

    smokeSystem.emitter = emitterMesh; // Emit from the dirty plate
    smokeSystem.minEmitBox = new Vector3(-0.05, 0.05, -0.05); // Small area above plate center
    smokeSystem.maxEmitBox = new Vector3(0.05, 0.1, 0.05);

    // Colors (Greyish smoke)
    smokeSystem.color1 = new Color4(0.7, 0.7, 0.7, 0.1);
    smokeSystem.color2 = new Color4(0.8, 0.8, 0.8, 0.05);
    smokeSystem.colorDead = new Color4(0.9, 0.9, 0.9, 0);

    // Size (Small and wispy)
    smokeSystem.minSize = 0.1;
    smokeSystem.maxSize = 0.4;

    // Lifetime
    smokeSystem.minLifeTime = 1.5;
    smokeSystem.maxLifeTime = 3.0;

    // Emission Rate (Slow and continuous)
    smokeSystem.emitRate = 10;

    // Movement (Slow upward drift)
    smokeSystem.gravity = new Vector3(0, 0.15, 0); // Slow rise
    smokeSystem.direction1 = new Vector3(-0.05, 0.3, -0.05);
    smokeSystem.direction2 = new Vector3(0.05, 0.6, 0.05);
    smokeSystem.minEmitPower = 0.01;
    smokeSystem.maxEmitPower = 0.05;
    smokeSystem.updateSpeed = 0.015;

    smokeSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD; // Standard blending for smoke
    smokeSystem.disposeOnStop = true; // Clean up when stopped

    smokeSystem.start();
    this.dirtyPlateSmokeSystem = smokeSystem;
  }

  private _setupHorizontalProgressBar(): void {
    // 1. Create the Plane Mesh
    this.progressBarPlane = MeshBuilder.CreatePlane(
      `${this.mesh.name}_progressBarPlane`,
      {
        width: this.progressBarPlaneWidth,
        height: this.progressBarPlaneHeight,
      },
      this.scene,
    )

    // Position relative to the interactable mesh + offset
    this.progressBarPlane.setAbsolutePosition(this.mesh.getAbsolutePosition().add(this.billboardOffset))
    this.progressBarPlane.billboardMode = Mesh.BILLBOARDMODE_ALL // Always face camera
    this.progressBarPlane.renderingGroupId = 1 // Render on top
    this.progressBarPlane.isPickable = false
    this.progressBarPlane.setEnabled(false) // Start hidden

    // 2. Create the Dynamic Texture
    this.progressBarTexture = new DynamicTexture(
      `${this.mesh.name}_progressBarTexture`,
      {
        width: this.progressBarTextureWidth,
        height: this.progressBarTextureHeight,
      },
      this.scene,
      false,
      Texture.BILINEAR_SAMPLINGMODE,
    ) // MipMaps false, Bilinear sampling
    this.progressBarTexture.hasAlpha = true // Needed for transparency/drawing

    // 3. Create the Material
    this.progressBarMaterial = new StandardMaterial(`${this.mesh.name}_progressBarMat`, this.scene)
    this.progressBarMaterial.diffuseTexture = this.progressBarTexture
    this.progressBarMaterial.opacityTexture = this.progressBarTexture // Use alpha from this texture
    this.progressBarMaterial.useAlphaFromDiffuseTexture = false
    this.progressBarMaterial.emissiveColor = Color3.White() // Ignore lighting
    this.progressBarMaterial.disableLighting = true
    this.progressBarMaterial.backFaceCulling = false // Prevent disappearing if viewed from behind

    // 4. Apply Material to Plane
    this.progressBarPlane.material = this.progressBarMaterial
  }

  // --- Update method for the Horizontal Progress Bar ---
  private _updateHorizontalProgressBar(now: number): void {
    if (!this.isCooking || !this.progressBarTexture || !this.progressBarPlane || !this.progressBarPlane.isEnabled) {
      return
    }

    const progress = this.cookingTotalDuration > 0 ? Scalar.Clamp((now - this.cookingStartTime) / this.cookingTotalDuration, 0, 1) : 0

    // Get the drawing context
    const ctx = this.progressBarTexture.getContext()
    if (!ctx) {
      console.error(`[${this.id}] ERROR: Failed to get context from progressBarTexture!`)
      return
    }

    // Define drawing parameters
    const textureWidth = this.progressBarTextureWidth
    const textureHeight = this.progressBarTextureHeight
    const margin = 4
    const barX = margin
    const barY = margin
    const barWidth = textureWidth - 2 * margin
    const barHeight = textureHeight - 2 * margin
    const fillWidth = barWidth * progress

    // --- Drawing ---
    ctx.clearRect(0, 0, textureWidth, textureHeight)
    ctx.fillStyle = 'rgba(30, 30, 30, 0.8)'
    ctx.fillRect(barX, barY, barWidth, barHeight)

    if (fillWidth > 0) {
      let fillColor = '#86EFAC' // Green
      if (progress >= 0.8) {
        fillColor = '#F87171' // Red
      } else if (progress >= 1) {
        // Change color instantly when progress hits 1
        fillColor = '#808080' // Grey when done
      }
      ctx.fillStyle = fillColor
      ctx.fillRect(barX, barY, fillWidth, barHeight)
    }

    ctx.strokeStyle = 'rgba(200, 200, 200, 0.9)'
    ctx.lineWidth = 2
    ctx.strokeRect(barX, barY, barWidth, barHeight)

    // *** Update the texture ***
    this.progressBarTexture.update()
  }

  private _setupPromptMaterial(keyPrompt: string): void {
    let dynamicTexture: DynamicTexture
    const textureKey = `prompt_${keyPrompt}`
    if (InteractableObject.promptTextures.has(textureKey)) {
      dynamicTexture = InteractableObject.promptTextures.get(textureKey)!
    } else {
      dynamicTexture = new DynamicTexture(textureKey, { width: 64, height: 64 }, this.scene, false) // Generate MipMaps = false for sharp text
      const ctx = dynamicTexture.getContext() as CanvasRenderingContext2D
      ctx.fillRect(0, 0, 64, 64)
      ctx.fillStyle = '#FF9999' // Dark text
      ctx.font = 'bold 32px "Patrick Hand"' // Simple, clear font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(keyPrompt.toUpperCase(), 32, 34) // Adjust baseline slightly
      dynamicTexture.update(true) // Update texture
      InteractableObject.promptTextures.set(textureKey, dynamicTexture)
    }

    const mat = new StandardMaterial('promptMat', this.scene)
    mat.diffuseTexture = dynamicTexture
    mat.opacityTexture = dynamicTexture // Use texture for alpha
    mat.useAlphaFromDiffuseTexture = false // We use opacityTexture
    mat.emissiveColor = Color3.White() // Make it glow slightly ignoring light
    mat.disableLighting = true
    this.promptDisc.material = mat
  }

  private _setupRenderObserver(): void {
    // Remove existing observer if any (e.g., during hot-reloading)
    if (this._renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this._renderObserver)
    }

    this._renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      const now = Date.now()

      // Update prompt position
      if (this.promptDisc.isEnabled()) {
        this.mesh.getAbsolutePosition().addToRef(this.billboardOffset, this._positionUpdateTemp)
        this._positionUpdateTemp.y += Math.sin(Date.now() * 0.0015) * 0.15
        this.promptDisc.setAbsolutePosition(this._positionUpdateTemp)
      }

      // Update ingredient positions based on the anchor
      if (this.displayedIngredientInfos.length > 0 || this.cookingVisualInfo) {
        const anchorWorldMatrix = this.ingredientAnchor.getWorldMatrix()

        // Update regular ingredients
        for (const info of this.displayedIngredientInfos) {
          Vector3.TransformCoordinatesToRef(info.localOffset, anchorWorldMatrix, this._positionUpdateTemp)
          info.mesh.setAbsolutePosition(this._positionUpdateTemp)
          // Combine anchor's world rotation with the ingredient's local rotation
          this.ingredientAnchor.absoluteRotationQuaternion.multiplyToRef(info.localRotation, info.mesh.rotationQuaternion!)
          // Apply the *intended* local scale, ignoring parent scale
          info.mesh.scaling.copyFrom(info.localScale)
        }

        // Update cooking visual (if any)
        if (this.cookingVisualInfo) {
          Vector3.TransformCoordinatesToRef(this.cookingVisualInfo.localOffset, anchorWorldMatrix, this._positionUpdateTemp)
          this.cookingVisualInfo.mesh.setAbsolutePosition(this._positionUpdateTemp)
          this.ingredientAnchor.absoluteRotationQuaternion.multiplyToRef(
            this.cookingVisualInfo.localRotation,
            this.cookingVisualInfo.mesh.rotationQuaternion!,
          )
          this.cookingVisualInfo.mesh.scaling.copyFrom(this.cookingVisualInfo.localScale)
        }
      }

      if (this.isCooking && this.interactType === InteractType.Oven && this.progressBarPlane) {
        // Update position dynamically every frame
        this.mesh.getAbsolutePosition().addToRef(this.billboardOffset, this._positionUpdateTemp)
        this.progressBarPlane.setAbsolutePosition(this._positionUpdateTemp)

        if (now - this.lastProgressBarUpdateTime > this.progressBarUpdateInterval) {
          this._updateHorizontalProgressBar(now)
          this.lastProgressBarUpdateTime = now
        }
      }
    })
  }

  public static reset(): void {
    this.promptTextures.forEach((texture) => texture.dispose())
    this.promptTextures.clear()
    this.particleTextures.forEach((texture) => texture.dispose())
    this.particleTextures.clear()
  }

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
    this.sparkleSystem.stop() // Start stopped
  }

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
    const allowPromptDespiteDisabled = this.interactType === InteractType.ServingOrder && !!this.dirtyPlateMesh;

    if ((this.disabled || this.isActive) && !allowPromptDespiteDisabled) {
      show = false;
    }

    if (this.promptDisc.isEnabled() !== show) {
      this.promptDisc.setEnabled(show)
      if (this.sparkleSystem) {
        if (show) this.sparkleSystem.start()
        else this.sparkleSystem.stop()
      }
    }
  }

  public activate(activeSince?: number, processingEndTime?: number): void {
    if (this.isActive) return
    this.isActive = true
    this.showPrompt(false)

    const isOven = this.interactType === InteractType.Oven
    const hasValidTimes = activeSince && processingEndTime && processingEndTime > activeSince
    const shouldStartCooking = isOven && hasValidTimes

    if (shouldStartCooking) {
      this._startOvenEffects()
      this.startCookingVisuals(activeSince!, processingEndTime!)
    }

    this.showDirtyPlateVisual(false);
  }

  public deactivate(): void {
    if (!this.isActive) return
    this.isActive = false

    this.activeParticleSystems.forEach((system) => {
      system.stop()
    })
    this.activeParticleSystems = []

    if (this.interactType === InteractType.Oven) {
      this.stopCookingVisuals()
    }
  }

  public startCookingVisuals(startTime: number, endTime: number): void {
    if (this.interactType !== InteractType.Oven || !this.progressBarPlane || !this.progressBarTexture) {
      console.error(`[${this.id}] Cannot start cooking visuals: Progress bar not setup correctly or not an Oven.`)
      return
    }

    this.cookingStartTime = startTime
    this.cookingTotalDuration = Math.max(1, endTime - startTime)
    this.isCooking = true

    this.progressBarPlane.setEnabled(true)

    // --- Reset Update Timer ---
    this.lastProgressBarUpdateTime = 0 // Reset timer to ensure the first update happens soon

    // --- Trigger the initial update immediately ---
    const initialTime = Date.now()
    this._updateHorizontalProgressBar(initialTime) // Draw the very first frame
    this.lastProgressBarUpdateTime = initialTime // Set the timer after the initial draw
  }

  public stopCookingVisuals(): void {
    if (!this.isCooking) {
      return
    }
    this.isCooking = false

    if (this.progressBarPlane) {
      this.progressBarPlane.setEnabled(false)
    }

    if (this.progressBarTexture) {
      const ctx = this.progressBarTexture.getContext()
      if (ctx) {
        ctx.clearRect(0, 0, this.progressBarTextureWidth, this.progressBarTextureHeight)
        this.progressBarTexture.update()
      }
    }

    this.lastProgressBarUpdateTime = 0 // Reset timer
  }

  private _startOvenEffects(): void {
    // --- Oven Particle Effect Logic ---
    let fireTexture: Texture
    const texturePath = 'assets/particles/Star-Texture.png' // Consider using a softer texture like flare.png if available
    if (InteractableObject.particleTextures.has(texturePath)) {
      fireTexture = InteractableObject.particleTextures.get(texturePath)!
    } else {
      fireTexture = new Texture(texturePath, this.scene)
      fireTexture.hasAlpha = true
      InteractableObject.particleTextures.set(texturePath, fireTexture)
    }

    const fire = new ParticleSystem('fire', 600, this.scene) // Name could be more specific like 'ovenFlame'
    fire.particleTexture = fireTexture.clone()
    const firePosition = new Vector3()
    firePosition.copyFrom(this.mesh.getAbsolutePosition())
    firePosition.y += 0.4
    firePosition.z -= 0.2

    const smokePosition = new Vector3()
    smokePosition.copyFrom(firePosition)
    smokePosition.y += 0.4

    fire.emitter = firePosition // Emitter is a single point

    // Emitter area (slightly wider than before, still flat)
    const minEmitBox = new Vector3(-0.3, 0, -0.3)
    const maxEmitBox = new Vector3(0.3, 0.1, 0.3) // Small vertical spread
    fire.minEmitBox = minEmitBox
    fire.maxEmitBox = maxEmitBox

    // --- COLOR CHANGES START ---
    // Define base colors (Orange/Yellow to Red range)
    fire.color1 = new Color4(1.0, 0.7, 0.0, 1.0) // Bright Orange/Yellow
    fire.color2 = new Color4(1.0, 0.3, 0.0, 1.0) // Orange-Red
    fire.colorDead = new Color4(0.2, 0, 0, 0.0) // Fade to dark red transparent

    // Define color gradient over particle lifetime
    fire.addColorGradient(0.0, new Color4(1.0, 0.8, 0.1, 1.0)) // Start Bright Yellow/Orange
    fire.addColorGradient(0.4, new Color4(1.0, 0.5, 0.0, 0.9)) // Mid-life Orange
    fire.addColorGradient(0.8, new Color4(0.9, 0.1, 0.0, 0.5)) // Towards end: Red, slightly faded alpha
    fire.addColorGradient(1.0, fire.colorDead.clone()) // End: Fully faded
    // --- COLOR CHANGES END ---

    fire.minSize = 0.03 // Slightly larger minimum
    fire.maxSize = 0.15 // Slightly larger maximum

    fire.minLifeTime = 0.15 // Shorter lifetime for faster flicker
    fire.maxLifeTime = 0.25 // Shorter lifetime for faster flicker

    // Optional: Size gradient (can make flames appear to thin out)
    fire.addSizeGradient(0, 0.03)
    fire.addSizeGradient(0.5, 0.15) // Grow
    fire.addSizeGradient(1.0, 0.01) // Shrink rapidly at end

    fire.emitRate = 400 // Increase emit rate for denser flames
    fire.blendMode = ParticleSystem.BLENDMODE_ADD // Additive blending is good for fire

    fire.minInitialRotation = 0
    fire.maxInitialRotation = Math.PI * 2
    fire.minAngularSpeed = -Math.PI * 2 // Faster rotation
    fire.maxAngularSpeed = Math.PI * 2 // Faster rotation

    // --- MOVEMENT CHANGES START ---
    // Make flames rise - Zero gravity, rely on direction/emit power
    fire.gravity = new Vector3(0, 0, 0) // No gravity pull

    // Direction: Primarily upwards, with slight horizontal spread
    const direction1 = new Vector3(-0.2, 1.5, -0.2) // Less horizontal, more vertical focus
    const direction2 = new Vector3(0.2, 3.0, 0.2) // Stronger upward push
    fire.direction1 = direction1
    fire.direction2 = direction2

    // Emit Power: Controls initial speed
    fire.minEmitPower = 0.5 // Stronger initial burst
    fire.maxEmitPower = 1.0 // Stronger initial burst
    // --- MOVEMENT CHANGES END ---

    fire.updateSpeed = 0.008 // Slightly faster update for flickering effect

    fire.disposeOnStop = true // Dispose when stopped (standard practice)

    // --- SMOKE PARTICLE SYSTEM CONFIGURATION (Cooking Smoke) ---
    let smokeTexture: Texture
    const smokeTexturePath = 'assets/particles/ExplosionTexture-Smoke-1.png'
    if (InteractableObject.particleTextures.has(smokeTexturePath)) {
      smokeTexture = InteractableObject.particleTextures.get(smokeTexturePath)!
    } else {
      smokeTexture = new Texture(smokeTexturePath, this.scene)
      smokeTexture.hasAlpha = true
      InteractableObject.particleTextures.set(smokeTexturePath, smokeTexture)
    }
    const smoke = new ParticleSystem('smoke', 150, this.scene)
    smoke.particleTexture = smokeTexture.clone()
    smoke.emitter = smokePosition
    smoke.minEmitBox = new Vector3(-0.3, 0.1, -0.3)
    smoke.maxEmitBox = new Vector3(0.3, 0.2, 0.3)

    // Whiter, very transparent
    smoke.color1 = new Color4(1, 1, 1, 0.05)
    smoke.color2 = new Color4(0.9, 0.9, 0.9, 0.03)
    smoke.colorDead = new Color4(1, 1, 1, 0)

    // Smooth fade in / out
    smoke.addColorGradient(0.0, new Color4(1, 1, 1, 0.0)) // completely invisible at spawn
    smoke.addColorGradient(0.3, new Color4(1, 1, 1, 0.05)) // gentle fade in
    smoke.addColorGradient(0.7, new Color4(0.9, 0.9, 0.9, 0.02))
    smoke.addColorGradient(1.0, new Color4(1, 1, 1, 0.0)) // fade out to invisible

    // Soft, billowy look
    smoke.minSize = 0.5
    smoke.maxSize = 1.5
    smoke.addSizeGradient(0.0, 0.4)
    smoke.addSizeGradient(0.5, 1.2)
    smoke.addSizeGradient(1.0, 1.8)

    smoke.minLifeTime = 1.2 // lingers longer
    smoke.maxLifeTime = 2.5

    smoke.emitRate = 6 // fewer particles, more wispy
    smoke.blendMode = ParticleSystem.BLENDMODE_STANDARD

    smoke.minInitialRotation = 0
    smoke.maxInitialRotation = Math.PI * 2
    smoke.minAngularSpeed = -0.2
    smoke.maxAngularSpeed = 0.2

    // Slow, upward drift
    smoke.gravity = new Vector3(0, 0.2, 0)
    smoke.direction1 = new Vector3(-0.05, 0.8, -0.05)
    smoke.direction2 = new Vector3(0.05, 1.2, 0.05)
    smoke.minEmitPower = 0.02
    smoke.maxEmitPower = 0.08
    smoke.updateSpeed = 0.02

    smoke.disposeOnStop = true

    // --- Start Systems ---
    fire.start()
    smoke.start()

    this.activeParticleSystems.push(fire, smoke)
  }

  public interact(): void {
    if (this.disabled && !this.isActive) {
      return
    }
  }

  /**
   * Creates or gets an ingredient mesh and prepares its info for placement.
   * Does NOT place it yet, placement happens in the render loop.
   */
  private _prepareIngredientVisual(
    ingredientId: Ingredient,
    localOffset: Vector3,
    localRotation: Quaternion = Quaternion.Identity(), // Default rotation
  ): DisplayedIngredientInfo | null {
    if (!this.ingredientLoader) return null

    const mesh = this.ingredientLoader.getIngredientMesh(ingredientId)
    if (!mesh) return null

    mesh.isPickable = false
    mesh.getChildMeshes(false, (node) => node instanceof Mesh).forEach((m) => (m.isPickable = false))
    mesh.setEnabled(true)

    // --- Apply Config ---
    const holdingConfig = INGREDIENT_VISUAL_CONFIG[ingredientId]
    const contextConfig = holdingConfig?.onBoard ?? holdingConfig?.hand

    // Apply unified scale
    const defaultScale = new Vector3(0.5, 0.5, 0.5)
    const finalScale = holdingConfig?.scale ? new Vector3(holdingConfig.scale.x, holdingConfig.scale.y, holdingConfig.scale.z) : defaultScale

    const rotationOffset = contextConfig?.rotationOffset
      ? new Quaternion(contextConfig.rotationOffset.x, contextConfig.rotationOffset.y, contextConfig.rotationOffset.z, contextConfig.rotationOffset.w)
      : Quaternion.Identity()
    const finalRotation = localRotation.multiply(rotationOffset)

    const positionOffset = contextConfig?.positionOffset
      ? new Vector3(contextConfig.positionOffset.x, contextConfig.positionOffset.y, contextConfig.positionOffset.z)
      : Vector3.Zero()
    const finalOffset = localOffset.add(positionOffset)

    return {
      mesh,
      localOffset: finalOffset.clone(),
      localRotation: finalRotation.clone(),
      localScale: finalScale.clone(),
    }
  }

  public updateIngredientsOnBoard(ingredients: Ingredient[]): void {
    const ingredientsChanged =
      ingredients.length !== this.lastIngredientsOnBoard.length || !ingredients.every((ing, i) => ing === this.lastIngredientsOnBoard[i])

    if (!ingredientsChanged && this.displayedIngredientInfos.length > 0) {
      return
    }

    // --- Result Detection ---
    const currentResult = ingredients.find((ing) => getItemDefinition(ing)?.isFinal)
    const previousResult = this.lastIngredientsOnBoard.find((ing) => getItemDefinition(ing)?.isFinal)
    const justGotResult = !!currentResult && !previousResult

    this.clearIngredientsOnBoard()

    if (!this.ingredientLoader) {
      console.warn('IngredientLoader not available for updating board visuals.')
      this.lastIngredientsOnBoard = [...ingredients]
      return
    }

    let plateInfo: DisplayedIngredientInfo | null = null
    let dishInfo: DisplayedIngredientInfo | null = null
    const otherIngredientInfos: DisplayedIngredientInfo[] = []

    // --- Placement Logic ---
    if (this.interactType === InteractType.ServingBoard) {
      const hasPlate = ingredients.includes(Ingredient.Plate)
      const dishIngredientId = ingredients.find((ing) => ing !== Ingredient.Plate && getItemDefinition(ing)?.isFinal)

      if (hasPlate) {
        plateInfo = this._prepareIngredientVisual(Ingredient.Plate, Vector3.Zero())
        if (plateInfo) this.displayedIngredientInfos.push(plateInfo)
      }

      if (dishIngredientId) {
        const dishYOffset = hasPlate ? 0.12 : 0.05
        const dishOffset = new Vector3(0, dishYOffset, 0)
        dishInfo = this._prepareIngredientVisual(dishIngredientId, dishOffset)
        if (dishInfo) this.displayedIngredientInfos.push(dishInfo)
      }
    } else if (this.interactType === InteractType.ChoppingBoard || this.interactType === InteractType.Oven) {
      const isOven = this.interactType === InteractType.Oven
      const yBaseOffset = isOven ? 3 : 0
      const yStackOffset = 0.05
      const xSpread = 0.15
      const zOffset = isOven ? 0.37 : 0

      const itemsToDisplay = ingredients.filter((ing) => ing !== Ingredient.Plate) // Filter out results/plates
      const numItems = itemsToDisplay.length

      itemsToDisplay.forEach((ingredientId, index) => {
        const yPos = yBaseOffset + index * yStackOffset
        const xPos = numItems > 1 ? (index - (numItems - 1) / 2) * xSpread : 0
        const localOffset = new Vector3(xPos, yPos, zOffset)
        const ingredientInfo = this._prepareIngredientVisual(ingredientId, localOffset)
        if (ingredientInfo) {
          otherIngredientInfos.push(ingredientInfo)
        }
      })
      this.displayedIngredientInfos.push(...otherIngredientInfos)
    }

    // --- Finalize ---
    if (justGotResult) {
      this.playCraftCompleteEffect()
    }

    this.lastIngredientsOnBoard = [...ingredients]
  }

  public showCookingVisual(ingredient: Ingredient): void {
    if (this.cookingVisualInfo || !this.ingredientLoader) {
      return
    }

    if (ingredient === Ingredient.Rice && this.interactType === InteractType.Oven) {
      const localOffset = new Vector3(0, 3, 0.37)
      const visualInfo = this._prepareIngredientVisual(ingredient, localOffset)

      if (visualInfo) {
        this.cookingVisualInfo = visualInfo
      }
    }
  }

  public hideCookingVisual(): void {
    if (this.cookingVisualInfo) {
      this.cookingVisualInfo.mesh.dispose()
      this.cookingVisualInfo = null
    }
  }

  private playCraftCompleteEffect(): void {
    const capacity = 50
    const effectSystem = new ParticleSystem(`${this.mesh.name}_craft_complete`, capacity, this.scene)

    // --- Configure the effect ---
    // Emitter position slightly above the station center
    const emitterPos = this.mesh.getAbsolutePosition().add(new Vector3(0, 0.3, 0)) // Adjust Y as needed
    effectSystem.emitter = emitterPos
    effectSystem.particleEmitterType = effectSystem.createSphereEmitter(1.2)

    // Texture (using flare for sparkles)
    let flareTexture: Texture
    const texturePath = 'assets/particles/Star-Texture.png' // Or use Star-Texture.png
    if (InteractableObject.particleTextures.has(texturePath)) {
      flareTexture = InteractableObject.particleTextures.get(texturePath)!
    } else {
      flareTexture = new Texture(texturePath, this.scene)
      flareTexture.hasAlpha = true
      InteractableObject.particleTextures.set(texturePath, flareTexture)
    }
    effectSystem.particleTexture = flareTexture

    // Colors (Bright and celebratory)
    effectSystem.color1 = new Color4(1.0, 1.0, 0.5, 1.0) // Yellow
    effectSystem.color2 = new Color4(1.0, 0.8, 0.2, 1.0) // Orange/Gold
    effectSystem.colorDead = new Color4(0, 0, 0, 0.0) // Fade out completely

    // Size
    effectSystem.minSize = 0.05
    effectSystem.maxSize = 0.15

    // Lifetime (Short burst)
    effectSystem.minLifeTime = 0.3
    effectSystem.maxLifeTime = 0.8

    // Emission (Burst)
    effectSystem.emitRate = capacity / effectSystem.maxLifeTime // Emit all particles quickly
    effectSystem.manualEmitCount = capacity // Ensure all particles are emitted
    effectSystem.maxEmitPower = 2
    effectSystem.minEmitPower = 1
    effectSystem.updateSpeed = 0.01

    // Shape & Movement
    effectSystem.gravity = new Vector3(0, -3.0, 0) // Slight downward pull
    effectSystem.direction1 = new Vector3(-1, 2, -1) // Upward and outward burst
    effectSystem.direction2 = new Vector3(1, 4, 1)

    // Blending
    effectSystem.blendMode = ParticleSystem.BLENDMODE_ADD

    // Start & Schedule Stop/Return
    effectSystem.start()
    setTimeout(
      () => {
        if (effectSystem) {
          // Check if system still exists
          effectSystem.stop()
        }
      },
      (effectSystem.maxLifeTime + 0.2) * 1000,
    ) // Stop slightly after max lifetime
  }

  public clearIngredientsOnBoard(): void {
    this.displayedIngredientInfos.forEach((info) => {
      info.mesh.dispose()
    })
    this.displayedIngredientInfos = []
    // Don't clear lastIngredientsOnBoard here, needed for change detection
  }

  public dispose(): void {
    console.log(`Disposing InteractableObject ${this.id} (${this.mesh.name})`)
    this.stopCookingVisuals()
    this.deactivate()
    this.clearIngredientsOnBoard()
    this.hideCookingVisual()

    if (this.sparkleSystem) {
      this.sparkleSystem.stop()
      this.sparkleSystem.dispose()
    }

    if (this.progressBarPlane) {
      this.progressBarPlane.dispose()
      this.progressBarPlane = null
    }
    if (this.progressBarTexture) {
      this.progressBarTexture.dispose()
      this.progressBarTexture = null
    }
    if (this.progressBarMaterial) {
      this.progressBarMaterial.dispose()
      this.progressBarMaterial = null
    }

    this.promptDisc.dispose()
    this.ingredientAnchor.dispose()

    if (this._renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this._renderObserver)
      this._renderObserver = null
    }

    this.showDirtyPlateVisual(false);
  }
}
