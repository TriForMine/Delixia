import type { Scene } from '@babylonjs/core/scene'

/**
 * Manages input focus and pointer lock for the game.
 * Handles events related to visibility, focus, and canvas interaction.
 */
export class InputManager {
  private readonly scene: Scene;
  private visibilityChangeHandler: () => void;
  private windowFocusHandler: () => void;
  private canvasClickHandler: () => void;

  /**
   * Creates a new InputManager.
   * @param scene The Babylon.js scene
   */
  constructor(scene: Scene) {
    this.scene = scene;

    // Create bound event handlers
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
    this.windowFocusHandler = this.handleWindowFocus.bind(this);
    this.canvasClickHandler = this.handleCanvasClick.bind(this);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Handles document visibility change events.
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.requestFocusAndPointerLock();
    }
  }

  /**
   * Handles window focus events.
   */
  private handleWindowFocus(): void {
    this.requestFocusAndPointerLock();
  }

  /**
   * Handles canvas click events.
   */
  private handleCanvasClick(): void {
    this.requestFocusAndPointerLock();
  }

  /**
   * Sets up event listeners for visibility change, window focus, and canvas click.
   */
  private setupEventListeners(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    // Add event listeners
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    window.addEventListener('focus', this.windowFocusHandler);
    canvas.addEventListener('click', this.canvasClickHandler);
  }

  /**
   * Requests focus and pointer lock for the game canvas.
   * This is called when:
   * - The game initializes
   * - The window regains focus
   * - The document becomes visible
   * - The canvas is clicked
   */
  public requestFocusAndPointerLock(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    // First focus the canvas
    canvas.focus();

    // Then request pointer lock after a small delay to ensure focus is processed
    setTimeout(() => {
      // Only request pointer lock if document is visible and window has focus
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        canvas.requestPointerLock().catch((error) => {
          console.warn('Failed to acquire pointer lock:', error);
        });
      }
    }, 100);
  }

  /**
   * Disposes of the InputManager and removes event listeners.
   */
  public dispose(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    window.removeEventListener('focus', this.windowFocusHandler);
    canvas.removeEventListener('click', this.canvasClickHandler);
  }
}
