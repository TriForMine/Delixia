import { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator'
import type { Scene } from '@babylonjs/core/scene'
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Control } from '@babylonjs/gui/2D/controls/control'

/**
 * Manages performance monitoring and optimization for the game.
 * Handles FPS display, hardware scaling, and shadow quality adjustments.
 */
export class PerformanceManager {
  private readonly scene: Scene;
  private readonly shadowGenerator: CascadedShadowGenerator;
  private fpsText?: TextBlock;
  private lastPerformanceUpdate: number = 0;
  private lastShadowQualityCheck: number = 0;

  private readonly PERFORMANCE_UPDATE_INTERVAL: number = 1000; // Update every second
  private readonly SHADOW_QUALITY_CHECK_INTERVAL: number = 5000; // Check shadow quality every 5 seconds

  /**
   * Creates a new PerformanceManager.
   * @param scene The Babylon.js scene
   * @param shadowGenerator The shadow generator to adjust
   */
  constructor(scene: Scene, shadowGenerator: CascadedShadowGenerator) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;

    // Initialize the FPS counter
    this.initializeFpsCounter();

    // Set initial shadow quality based on device capabilities
    this.adjustShadowQuality();
  }

  /**
   * Initializes the FPS counter UI element.
   */
  private initializeFpsCounter(): void {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('PerformanceUI');

    this.fpsText = new TextBlock();
    this.fpsText.text = 'FPS: 0';
    this.fpsText.color = 'white';
    this.fpsText.fontSize = 16;
    this.fpsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.fpsText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.fpsText.paddingRight = '10px';
    this.fpsText.paddingTop = '10px';
    advancedTexture.addControl(this.fpsText);
  }

  /**
   * Updates performance metrics and optimizations.
   * Should be called every frame.
   */
  public update(): void {
    // Update performance metrics (less frequently to reduce overhead)
    const currentTime = Date.now();
    if (currentTime - this.lastPerformanceUpdate > this.PERFORMANCE_UPDATE_INTERVAL) {
      const engine = this.scene.getEngine();
      const fps = engine.getFps().toFixed();

      if (this.fpsText) {
        this.fpsText.text = `FPS: ${fps}`;
      }

      this.lastPerformanceUpdate = currentTime;

      // Auto-adjust quality if FPS drops too low
      if (Number(fps) < 30) {
        engine.setHardwareScalingLevel(engine.getHardwareScalingLevel() * 1.1);
      } else if (Number(fps) > 60 && engine.getHardwareScalingLevel() > 1.0) {
        engine.setHardwareScalingLevel(Math.max(1.0, engine.getHardwareScalingLevel() * 0.9));
      }

      // Check if we should adjust shadow quality
      if (currentTime - this.lastShadowQualityCheck > this.SHADOW_QUALITY_CHECK_INTERVAL) {
        this.adjustShadowQuality(Number(fps));
        this.lastShadowQualityCheck = currentTime;
      }
    }
  }

  /**
   * Adjusts shadow quality based on current FPS and device capabilities
   * @param currentFps Current frames per second
   */
  public adjustShadowQuality(currentFps: number = 60): void {
    if (!this.shadowGenerator) return;

    // Get device capabilities
    const engine = this.scene.getEngine();
    const hardwareLevel = engine.getCaps().maxTextureSize > 4096 ? "high" : "medium";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Determine quality level based on FPS and hardware
    let qualityLevel: "ultra" | "high" | "medium" | "low";

    if (currentFps >= 55 && hardwareLevel === "high" && !isMobile) {
      qualityLevel = "high";
    } else if (currentFps >= 40) {
      qualityLevel = "medium";
    } else {
      qualityLevel = "low";
    }

    // Apply shadow settings based on quality level
    switch (qualityLevel) {
      case "high":
        this.shadowGenerator.useContactHardeningShadow = true;
        this.shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
        this.shadowGenerator.blurKernel = 16;
        this.shadowGenerator.usePercentageCloserFiltering = true;
        this.shadowGenerator.filteringQuality = CascadedShadowGenerator.QUALITY_HIGH;
        this.shadowGenerator.numCascades = 4;
        // Anti-acne settings for high quality
        this.shadowGenerator.bias = 0.001;
        this.shadowGenerator.normalBias = 0.02;
        this.shadowGenerator.depthScale = 50;
        break;

      case "medium":
        this.shadowGenerator.useContactHardeningShadow = false;
        this.shadowGenerator.blurKernel = 8;
        this.shadowGenerator.usePercentageCloserFiltering = true;
        this.shadowGenerator.filteringQuality = CascadedShadowGenerator.QUALITY_MEDIUM;
        this.shadowGenerator.numCascades = 3;
        // Anti-acne settings for medium quality (slightly higher bias to compensate for lower resolution)
        this.shadowGenerator.bias = 0.0015;
        this.shadowGenerator.normalBias = 0.025;
        this.shadowGenerator.depthScale = 45;
        break;

      case "low":
        this.shadowGenerator.useContactHardeningShadow = false;
        this.shadowGenerator.blurKernel = 4;
        this.shadowGenerator.usePercentageCloserFiltering = false;
        this.shadowGenerator.filteringQuality = CascadedShadowGenerator.QUALITY_LOW;
        this.shadowGenerator.numCascades = 2;
        // Anti-acne settings for low quality (higher bias to compensate for lowest resolution)
        this.shadowGenerator.bias = 0.002;
        this.shadowGenerator.normalBias = 0.02;
        this.shadowGenerator.depthScale = 40;
        break;
    }

    // Adjust shadow distance based on FPS
    if (currentFps < 30) {
      this.shadowGenerator.shadowMaxZ = 15; // Reduce shadow distance for better performance
    } else if (currentFps > 50) {
      this.shadowGenerator.shadowMaxZ = 20; // Increase shadow distance for better quality
    }
  }

  /**
   * Disposes of the PerformanceManager and its resources.
   */
  public dispose(): void {
    // Nothing to dispose currently
  }
}
