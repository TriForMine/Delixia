import type { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator'
import type { Scene } from '@babylonjs/core/scene'
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Control } from '@babylonjs/gui/2D/controls/control'

/**
 * Manages performance monitoring and optimization for the game.
 * Handles FPS display, hardware scaling, and shadow quality adjustments.
 */
export class PerformanceManager {
  private readonly scene: Scene
  private readonly shadowGenerator: CascadedShadowGenerator
  private fpsText?: TextBlock
  private lastPerformanceUpdate: number = 0

  private readonly PERFORMANCE_UPDATE_INTERVAL: number = 1000 // Update every second

  /**
   * Creates a new PerformanceManager.
   * @param scene The Babylon.js scene
   * @param shadowGenerator The shadow generator to adjust
   */
  constructor(scene: Scene, shadowGenerator: CascadedShadowGenerator) {
    this.scene = scene
    this.shadowGenerator = shadowGenerator

    // Initialize the FPS counter
    this.initializeFpsCounter()

    // Set initial shadow quality based on device capabilities
    this.adjustShadowQuality()
  }

  /**
   * Initializes the FPS counter UI element.
   */
  private initializeFpsCounter(): void {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('PerformanceUI')

    this.fpsText = new TextBlock()
    this.fpsText.text = 'FPS: 0'
    this.fpsText.color = 'white'
    this.fpsText.fontSize = 16
    this.fpsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
    this.fpsText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    this.fpsText.paddingRight = '10px'
    this.fpsText.paddingTop = '10px'
    advancedTexture.addControl(this.fpsText)
  }

  /**
   * Updates performance metrics and optimizations.
   * Should be called every frame.
   */
  public update(): void {
    // Update performance metrics (less frequently to reduce overhead)
    const currentTime = Date.now()
    if (currentTime - this.lastPerformanceUpdate > this.PERFORMANCE_UPDATE_INTERVAL) {
      const engine = this.scene.getEngine()
      const fps = engine.getFps().toFixed()

      if (this.fpsText) {
        this.fpsText.text = `FPS: ${fps}`
      }

      this.lastPerformanceUpdate = currentTime

      // Auto-adjust quality if FPS drops too low
      if (Number(fps) < 30) {
        engine.setHardwareScalingLevel(engine.getHardwareScalingLevel() * 1.1)
      } else if (Number(fps) > 60 && engine.getHardwareScalingLevel() > 1.0) {
        engine.setHardwareScalingLevel(Math.max(1.0, engine.getHardwareScalingLevel() * 0.9))
      }

      // No longer dynamically adjusting shadow quality based on FPS
    }
  }

  /**
   * Sets up cartoonish shadow style optimized for performance
   */
  public adjustShadowQuality(): void {
    if (!this.shadowGenerator) return

    this.shadowGenerator.blurKernel = 16 // Reduced blur kernel
    this.shadowGenerator.useKernelBlur = true
    this.shadowGenerator.usePercentageCloserFiltering = true
    this.shadowGenerator.shadowMaxZ = 20 // Reduced shadow distance
    this.shadowGenerator.stabilizeCascades = true // Reduce shadow flickering
    this.shadowGenerator.lambda = 0.8 // Stabilization factor
    this.shadowGenerator.cascadeBlendPercentage = 0.1 // Smoother transitions
    this.shadowGenerator.depthClamp = true // Optimize depth calculations
    this.shadowGenerator.autoCalcDepthBounds = true // Optimize depth bounds

    // Fix shadow acne by adjusting bias values
    this.shadowGenerator.bias = 0.001 // Prevents shadow acne (self-shadowing artifacts)
    this.shadowGenerator.normalBias = 0.3 // Adjusts bias based on surface normals
    this.shadowGenerator.depthScale = 50 // Adjusts depth calculation to reduce acne
  }

  /**
   * Disposes of the PerformanceManager and its resources.
   */
  public dispose(): void {
    // Nothing to dispose currently
  }
}
