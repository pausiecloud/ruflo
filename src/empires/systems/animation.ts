import { System, Entity } from '../core/ecs';
import { Sprite } from '../core/components';
import { Animation } from '../core/components-advanced';

/**
 * Animation System - Manages sprite frame animation and transitions
 * Supports idle, walk, attack, and death animations
 */
export class AnimationSystem extends System {
  readonly id = 'animation';
  readonly requiredComponents = ['animation', 'sprite'];

  constructor() {
    super();
    this.registerCommonAnimations();
  }

  private registerCommonAnimations(): void {
    // TODO: Register animations when units are created
  }

  update(deltaTime: number): void {
    this.entities.forEach((entity) => {
      const animation = entity.getComponent<Animation>('animation');
      const sprite = entity.getComponent<Sprite>('sprite');

      if (!animation || !sprite) return;

      // Update animation frame
      animation.update(deltaTime);

      // Update sprite frame index
      sprite.frameIndex = animation.currentFrame;
    });
  }

  /**
   * Plays an animation on an entity
   */
  playAnimation(entity: Entity, animationName: string, loop: boolean = true): boolean {
    const animation = entity.getComponent<Animation>('animation');
    if (!animation) return false;

    return animation.playAnimation(animationName, loop);
  }

  /**
   * Stops the current animation
   */
  stopAnimation(entity: Entity): void {
    const animation = entity.getComponent<Animation>('animation');
    if (!animation) return;

    animation.isPlaying = false;
  }

  /**
   * Gets current animation state
   */
  getAnimationState(entity: Entity): {
    currentAnimation: string | null;
    isPlaying: boolean;
    currentFrame: number;
    frameCount: number;
  } | null {
    const animation = entity.getComponent<Animation>('animation');
    if (!animation) return null;

    return {
      currentAnimation: animation.currentAnimation,
      isPlaying: animation.isPlaying,
      currentFrame: animation.currentFrame,
      frameCount: animation.frameCount,
    };
  }

  /**
   * Registers animation sequences for a unit type
   */
  registerUnitAnimations(unitType: string): Map<string, { frames: number; duration: number }> {
    const animations = new Map<string, { frames: number; duration: number }>();

    switch (unitType) {
      case 'worker':
        animations.set('idle', { frames: 4, duration: 1.0 });
        animations.set('walk', { frames: 8, duration: 0.8 });
        animations.set('gather', { frames: 6, duration: 1.2 });
        animations.set('build', { frames: 5, duration: 1.5 });
        animations.set('death', { frames: 4, duration: 0.5 });
        break;

      case 'soldier':
        animations.set('idle', { frames: 2, duration: 0.8 });
        animations.set('walk', { frames: 8, duration: 0.6 });
        animations.set('attack', { frames: 4, duration: 0.4 });
        animations.set('death', { frames: 5, duration: 0.6 });
        break;

      case 'archer':
        animations.set('idle', { frames: 2, duration: 0.8 });
        animations.set('walk', { frames: 8, duration: 0.7 });
        animations.set('attack', { frames: 6, duration: 0.5 });
        animations.set('reload', { frames: 3, duration: 0.4 });
        animations.set('death', { frames: 4, duration: 0.5 });
        break;

      case 'catapult':
        animations.set('idle', { frames: 1, duration: 1.0 });
        animations.set('aim', { frames: 3, duration: 0.6 });
        animations.set('fire', { frames: 2, duration: 0.3 });
        animations.set('reload', { frames: 4, duration: 1.2 });
        break;

      default:
        animations.set('idle', { frames: 1, duration: 1.0 });
        break;
    }

    return animations;
  }

  /**
   * Creates animated explosion effect
   */
  createExplosionAnimation(x: number, y: number): Entity | null {
    // TODO: Create temporary animation entity for explosions
    return null;
  }

  /**
   * Creates blood/damage indicator animation
   */
  createDamageIndicator(x: number, y: number, damage: number): void {
    // TODO: Float damage numbers above units
  }

  /**
   * Creates death animation and fades out unit
   */
  playDeathAnimation(entity: Entity): void {
    const animation = entity.getComponent<Animation>('animation');
    if (!animation) return;

    // Play death animation non-looping
    animation.playAnimation('death', false);

    // After death animation completes, unit can be removed
  }
}
