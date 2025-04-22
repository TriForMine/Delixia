import type { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator'
import type { Scene } from '@babylonjs/core/scene'
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Control } from '@babylonjs/gui/2D/controls/control'
import { type GraphicsQuality, settingsStore } from '@client/utils/settingsStore.ts'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'

/**
 * Manages performance monitoring and optimization for the game.
 * Handles FPS display, hardware scaling, and shadow quality adjustments.
 */
export class PerformanceManager {
  private readonly scene: Scene
  private readonly shadowGenerator?: CascadedShadowGenerator
  private fpsText?: TextBlock
  private fpsUI?: AdvancedDynamicTexture
  private lastPerformanceUpdate: number = 0

  private readonly PERFORMANCE_UPDATE_INTERVAL: number = 1000 // Update every second

  /**
   * Creates a new PerformanceManager.
   * @param scene The Babylon.js scene
   * @param shadowGenerator The shadow generator to adjust (optional)
   */
  constructor(scene: Scene, shadowGenerator?: CascadedShadowGenerator) {
    this.scene = scene
    this.shadowGenerator = shadowGenerator

    this.applySettings() // Apply initial settings from storage
  }

  /**
   * Applies settings from the settings store.
   */
  public applySettings(): void {
    this.setShowFps(settingsStore.getShowFps())
    this.setGraphicsQuality(settingsStore.getGraphicsQuality())
  }

  /**
   * Initializes or removes the FPS counter UI element based on the show flag.
   * @param show Whether to show the FPS counter.
   */
  public setShowFps(show: boolean): void {
    if (show && !this.fpsUI) {
      this.fpsUI = AdvancedDynamicTexture.CreateFullscreenUI('PerformanceUI', true, this.scene, Texture.BILINEAR_SAMPLINGMODE, true)

      this.fpsText = new TextBlock('fpsText', 'FPS: 0')
      this.fpsText.color = 'white'
      this.fpsText.fontSize = 20
      this.fpsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
      this.fpsText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
      this.fpsText.paddingRight = '10px'
      this.fpsText.paddingBottom = '10px'
      this.fpsUI.addControl(this.fpsText)
      this.lastPerformanceUpdate = 0
    } else if (!show && this.fpsUI) {
      this.fpsUI.dispose()
      this.fpsUI = undefined
      this.fpsText = undefined
    }
  }

  /**
   * Adjusts graphics settings based on the quality level.
   * @param quality The desired graphics quality.
   */
  public setGraphicsQuality(quality: GraphicsQuality): void {
    const engine = this.scene.getEngine()

    if (this.shadowGenerator) {
      switch (quality) {
        case 'low':
          this.shadowGenerator.shadowMaxZ = 20
          this.shadowGenerator.mapSize = 512
          this.shadowGenerator.blurKernel = 8
          this.shadowGenerator.lambda = 0.9
          engine.setHardwareScalingLevel(1.6)
          console.log('Graphics Quality set to LOW')
          break
        case 'medium':
          this.shadowGenerator.shadowMaxZ = 30
          this.shadowGenerator.mapSize = 1024
          this.shadowGenerator.blurKernel = 16
          this.shadowGenerator.lambda = 0.8
          engine.setHardwareScalingLevel(1.3)
          console.log('Graphics Quality set to MEDIUM')
          break
        case 'high':
        default:
          this.shadowGenerator.shadowMaxZ = 40
          this.shadowGenerator.mapSize = 2048
          this.shadowGenerator.blurKernel = 16
          this.shadowGenerator.lambda = 0.7
          engine.setHardwareScalingLevel(1.0)
          console.log('Graphics Quality set to HIGH')
          break
      }

      this.shadowGenerator.usePercentageCloserFiltering = true
      this.shadowGenerator.stabilizeCascades = true
      this.shadowGenerator.cascadeBlendPercentage = 0.1
      this.shadowGenerator.depthClamp = true
      this.shadowGenerator.autoCalcDepthBounds = true
      this.shadowGenerator.bias = 0.001
      this.shadowGenerator.normalBias = 0.03
      this.shadowGenerator.depthScale = 50
    } else {
      switch (quality) {
        case 'low':
          engine.setHardwareScalingLevel(2.0)
          console.log('Graphics Quality set to LOW (No Shadows)')
          break
        case 'medium':
          engine.setHardwareScalingLevel(1.5)
          console.log('Graphics Quality set to MEDIUM (No Shadows)')
          break
        case 'high':
        default:
          engine.setHardwareScalingLevel(1.0)
          console.log('Graphics Quality set to HIGH (No Shadows)')
          break
      }
    }
  }

  /**
   * Updates performance metrics and optimizations.
   * Should be called every frame.
   */
  public update(): void {
    // Only update FPS text if it's enabled
    if (this.fpsText) {
      const currentTime = Date.now()
      if (currentTime - this.lastPerformanceUpdate > this.PERFORMANCE_UPDATE_INTERVAL) {
        const engine = this.scene.getEngine()
        const fps = engine.getFps().toFixed()
        this.fpsText.text = `FPS: ${fps}`
        this.lastPerformanceUpdate = currentTime
      }
    }
  }

  /**
   * Disposes of the PerformanceManager and its resources.
   */
  public dispose(): void {
    if (this.fpsUI) {
      this.fpsUI.dispose()
      this.fpsUI = undefined
      this.fpsText = undefined
    }
    console.log('PerformanceManager disposed.')
  }
}
