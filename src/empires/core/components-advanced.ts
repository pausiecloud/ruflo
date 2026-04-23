import { Component } from '../core/ecs';

/**
 * Projectile component for physics-based combat
 * Implements realistic ballistics with gravity, wind, and drag
 */
export class Projectile implements Component {
  id = 'projectile';

  // Ownership
  ownerId: number; // Entity ID of who fired this
  ownerFaction: string;
  damage: number;

  // Physics
  initialVelocity: number; // m/s
  currentVelocityX: number;
  currentVelocityY: number;
  acceleration: number = -9.8; // gravity (pixels/s²)
  drag: number = 0.99; // air resistance
  mass: number = 1;

  // Targeting
  targetX: number;
  targetY: number;
  targetEntityId: number | null = null;

  // State
  traveled: number = 0;
  lifetime: number = 0;
  maxLifetime: number = 10; // seconds
  hasHit: boolean = false;
  impact: boolean = false;

  // Physics properties
  radius: number = 4; // collision radius
  splashRadius: number = 0; // 0 = no splash damage
  piercing: number = 0; // 0 = bounces, >0 = pierces through units

  constructor(
    ownerId: number,
    ownerFaction: string,
    startVelX: number,
    startVelY: number,
    damage: number,
    targetX: number,
    targetY: number
  ) {
    this.ownerId = ownerId;
    this.ownerFaction = ownerFaction;
    this.currentVelocityX = startVelX;
    this.currentVelocityY = startVelY;
    this.damage = damage;
    this.targetX = targetX;
    this.targetY = targetY;
    this.initialVelocity = Math.sqrt(startVelX * startVelX + startVelY * startVelY);
  }

  update(deltaTime: number): void {
    if (this.hasHit) return;

    // Apply gravity
    this.currentVelocityY += this.acceleration * deltaTime;

    // Apply drag/air resistance
    this.currentVelocityX *= this.drag;
    this.currentVelocityY *= this.drag;

    this.lifetime += deltaTime;

    // Check if projectile expired
    if (this.lifetime > this.maxLifetime) {
      this.hasHit = true;
      this.impact = true;
    }
  }

  getTrajectory(deltaTime: number): { x: number; y: number } {
    return {
      x: this.currentVelocityX * deltaTime,
      y: this.currentVelocityY * deltaTime,
    };
  }

  // Calculate ballistic launch angle for given distance
  static calculateLaunchAngle(
    distance: number,
    initialVelocity: number,
    gravity: number = 9.8
  ): number {
    const angle = Math.asin((gravity * distance) / (initialVelocity * initialVelocity));
    return angle;
  }

  // Calculate impact damage considering distance traveled
  getImpactDamage(): number {
    // Damage decreases with distance (velocity loss)
    const velocityFactor = Math.sqrt(
      this.currentVelocityX * this.currentVelocityX + this.currentVelocityY * this.currentVelocityY
    ) / this.initialVelocity;
    return this.damage * Math.max(0.3, velocityFactor); // Minimum 30% damage
  }
}

/**
 * Wreckage/Debris component - remains of destroyed units
 */
export class Wreckage implements Component {
  id = 'wreckage';

  type: string;
  faction: string;
  metalContent: number = 0;
  woodContent: number = 0;
  resourceValue: { type: string; amount: number }[] = [];
  retrievalProgress: number = 0;
  isRecovered: boolean = false;

  constructor(type: string, faction: string) {
    this.type = type;
    this.faction = faction;
  }

  recover(amount: number): void {
    this.retrievalProgress += amount;
  }
}

/**
 * Morale component - affects unit behavior and performance
 */
export class Morale implements Component {
  id = 'morale';

  current: number = 100; // 0-100
  max: number = 100;
  fearThreshold: number = 30; // Panic below this
  rageThreshold: number = 80; // Aggressive above this

  // Morale affects these multipliers
  damageMultiplier: number = 1.0;
  speedMultiplier: number = 1.0;
  accuracyMultiplier: number = 1.0;
  armorMultiplier: number = 1.0;

  // Morale state
  state: 'broken' | 'fearful' | 'normal' | 'steadfast' | 'fervor' = 'normal';
  unitsNearby: number = 0; // Friendly units providing morale boost

  constructor() {}

  update(deltaTime: number): void {
    this.updateMultipliers();
    this.updateState();
  }

  private updateMultipliers(): void {
    const moraleFactor = this.current / this.max;

    if (this.current <= 0) {
      this.state = 'broken';
      this.damageMultiplier = 0;
      this.speedMultiplier = 0;
      this.accuracyMultiplier = 0;
      return;
    }

    if (this.current < this.fearThreshold) {
      this.state = 'fearful';
      this.damageMultiplier = 0.4;
      this.speedMultiplier = 1.3; // Panicked flee
      this.accuracyMultiplier = 0.3;
      this.armorMultiplier = 0.8; // Careless, less defense
    } else if (this.current > this.rageThreshold) {
      this.state = 'fervor';
      this.damageMultiplier = 1.3;
      this.speedMultiplier = 1.1;
      this.accuracyMultiplier = 1.1;
      this.armorMultiplier = 0.9; // More aggressive, less cautious
    } else {
      this.state = 'normal';
      this.damageMultiplier = 1.0;
      this.speedMultiplier = 1.0;
      this.accuracyMultiplier = 1.0;
      this.armorMultiplier = 1.0;
    }

    // Morale regeneration when steady and units nearby
    if (this.state === 'normal' && this.unitsNearby > 0) {
      this.state = 'steadfast';
      this.damageMultiplier = 1.05;
      this.armorMultiplier = 1.05;
    }
  }

  private updateState(): void {
    // State is determined by updateMultipliers
  }

  takeCasualty(): void {
    // Each casualty nearby reduces morale
    this.current = Math.max(0, this.current - 5);
  }

  witnessVictory(enemyCount: number): void {
    // Morale boost from killing enemies
    this.current = Math.min(this.max, this.current + enemyCount * 2);
  }

  boostFromHero(): void {
    // Hero unit presence boosts morale
    this.current = Math.min(this.max, this.current + 10);
  }
}

/**
 * Navigation component - for naval/transport units
 */
export class Naval implements Component {
  id = 'naval';

  type: 'transport' | 'warship' | 'explorer';
  capacity: number = 0; // Units it can carry
  cargo: number[] = []; // Entity IDs of carried units
  speed: number = 60; // Naval units typically faster
  canFireWhileMoving: boolean = false;

  constructor(type: 'transport' | 'warship' | 'explorer', capacity: number) {
    this.type = type;
    this.capacity = capacity;
  }

  canLoadUnit(): boolean {
    return this.cargo.length < this.capacity;
  }

  loadUnit(unitId: number): boolean {
    if (this.canLoadUnit()) {
      this.cargo.push(unitId);
      return true;
    }
    return false;
  }

  unloadUnit(unitId: number): boolean {
    const index = this.cargo.indexOf(unitId);
    if (index > -1) {
      this.cargo.splice(index, 1);
      return true;
    }
    return false;
  }

  isFullyLoaded(): boolean {
    return this.cargo.length === this.capacity;
  }
}

/**
 * Animation component - sprite frame animation
 */
export class Animation implements Component {
  id = 'animation';

  currentFrame: number = 0;
  frameTime: number = 0;
  frameDuration: number = 0.1; // seconds per frame
  frameCount: number = 1;
  isLooping: boolean = true;
  isPlaying: boolean = true;

  // Named animations
  animations: Map<string, { frames: number; duration: number }> = new Map();
  currentAnimation: string | null = null;

  constructor(frameCount: number = 1, frameDuration: number = 0.1) {
    this.frameCount = frameCount;
    this.frameDuration = frameDuration;
  }

  registerAnimation(name: string, frameCount: number, duration: number): void {
    this.animations.set(name, { frames: frameCount, duration });
  }

  playAnimation(name: string, loop: boolean = true): boolean {
    if (!this.animations.has(name)) return false;

    this.currentAnimation = name;
    const anim = this.animations.get(name)!;
    this.frameCount = anim.frames;
    this.frameDuration = anim.duration / anim.frames;
    this.isLooping = loop;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.isPlaying = true;

    return true;
  }

  update(deltaTime: number): void {
    if (!this.isPlaying) return;

    this.frameTime += deltaTime;

    if (this.frameTime >= this.frameDuration) {
      this.frameTime -= this.frameDuration;
      this.currentFrame++;

      if (this.currentFrame >= this.frameCount) {
        if (this.isLooping) {
          this.currentFrame = 0;
        } else {
          this.isPlaying = false;
          this.currentFrame = this.frameCount - 1;
        }
      }
    }
  }
}
