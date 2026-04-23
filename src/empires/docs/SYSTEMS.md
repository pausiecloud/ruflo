# Empires RTS - Advanced Systems Documentation

Complete guide to all game systems and mechanics.

## Table of Contents

1. [Combat System](#combat-system)
2. [Morale System](#morale-system)
3. [Naval System](#naval-system)
4. [Wreckage System](#wreckage-system)
5. [Animation System](#animation-system)
6. [Component Reference](#component-reference)

---

## Combat System

### Overview

The Combat System manages projectile physics, ballistics, and impact damage. Projectiles follow realistic trajectories with gravity, air resistance, and splash damage.

### Physics Model

**Projectile Properties**:
- Initial velocity (m/s)
- Gravity acceleration (-9.8 pixels/s²)
- Air drag (0.99 per frame - slight resistance)
- Impact damage (decreases with distance)
- Splash radius (area damage)
- Piercing (can penetrate units)

### Firing Projectiles

```typescript
gameManager.fireProjectile(attacker, target, damage, splashRadius);
```

**Parameters**:
- `attacker`: Entity firing the projectile
- `target`: Target entity (null = fires in current direction)
- `damage`: Base damage at impact
- `splashRadius`: AoE radius (0 = no splash)

### Damage Calculation

Impact damage scales with velocity:
```
finalDamage = baseDamage × (currentVelocity / initialVelocity)
// Minimum: 30% of base damage
```

### Splash Damage

Affected units take reduced damage based on distance from epicenter:
```
aoeDamage = baseDamage × distanceFalloff × 0.75
// Falloff: max(0, 1 - distance / splashRadius)
```

### Combat Log

```typescript
const hitLog = gameManager.getCombatLog();
// Returns: { projectileId, targetId, damage }[]
// Automatically cleared after retrieval
```

---

## Morale System

### Overview

Morale affects unit performance through multipliers applied to damage, speed, armor, and accuracy. Morale is influenced by nearby units, casualties, and victories.

### Morale States

| State | Morale Range | Effects | Trigger |
|-------|-------------|---------|---------|
| **Broken** | 0 | No movement, no attacks | Health depleted |
| **Fearful** | 1-29 | 40% damage, 130% speed, 30% accuracy, 80% armor | Witnessing casualties |
| **Normal** | 30-79 | 100% baseline | Neutral conditions |
| **Steadfast** | 30-79 (+ units nearby) | 105% damage, 105% armor | Grouped formation |
| **Fervor** | 80-100 | 130% damage, 110% speed, 110% accuracy, 90% armor | Winning battles |

### Morale Multipliers

```typescript
interface Morale {
  damageMultiplier: number;    // 0.4 - 1.3
  speedMultiplier: number;     // 0.8 - 1.3
  accuracyMultiplier: number;  // 0.3 - 1.1
  armorMultiplier: number;     // 0.8 - 1.05
}
```

### Morale Events

**Casualty**:
```typescript
gameManager.recordUnitDeath(faction);
// -5 morale for all units in faction
```

**Victory**:
```typescript
gameManager.recordVictory(faction, enemyCount);
// +2 morale per enemy killed
```

**Hero Aura**:
```typescript
gameManager.applyHeroAura(heroPower);
// Hero units provide +morale boost to nearby units within 200px radius
```

### Morale Bonuses

- **Grouping**: Units within 100px of allies get +morale regeneration
- **Hero Presence**: Units within 200px of hero unit get +morale boost
- **Strength in Numbers**: Each additional friendly unit provides 1 morale bonus

### Morale Report

```typescript
const report = gameManager.getMoraleReport('solar_kingdom');
// Returns:
// {
//   averageMorale: 75,
//   unitCount: 12,
//   fearfulCount: 2,
//   fervorCount: 4,
//   casualtyRate: 0.25
// }
```

---

## Naval System

### Overview

The Naval System manages transport ships, unit ferrying, and naval combat. Allows land armies to cross water and access island resources.

### Naval Unit Types

#### Transport Ships
- Capacity: 6 units
- Speed: 60 (faster on water)
- Cannot fire while loaded
- Used for crossing water/ferrying units

#### Warships
- Capacity: 0 (no cargo)
- Speed: 60
- Attack Range: 200px
- Artillery damage: ~20-30 per shot
- Naval dominance

#### Explorers
- Capacity: 2 units
- Speed: 70 (fastest)
- Used for reconnaissance

### Loading Units

```typescript
// Auto-load nearby land units when ship approaches
gameManager.commandLoadUnits(transportEntity);

// Units within 32px automatically board when capacity available
// Boarded units become hidden (sprite.hidden = true)
```

### Unloading Units

```typescript
gameManager.commandUnloadUnits(transportEntity, destX, destY);

// Units drop at destination
// Nearby units within 50px of destination become visible
```

### Naval Combat

Warships engage each other automatically when within range:
- Projectiles follow naval ballistics (higher arc)
- Multiple warships can engage same target
- Naval vs ground units has range advantage

### Fleet Status

```typescript
const fleet = gameManager.getFleetStatus();
// Returns: { shipId, type, cargo, capacity }[]
```

### Water Detection

Ships are detected on water by checking terrain type. Islands and channels divide map into regions:
- Central continent (land)
- Rivers (water passage)
- Islands (land with resources)
- Deep ocean (impassable without ships)

---

## Wreckage System

### Overview

Destroyed units leave wreckage that workers can scrap for resources. Different unit types yield different amounts of metal and wood.

### Wreckage Values

| Unit Type | Metal | Wood | Recovery Time |
|-----------|-------|------|---|
| Worker | 15 | 10 | 20s |
| Soldier | 25 | 5 | 25s |
| Archer | 20 | 15 | 22s |
| Catapult | 60 | 30 | 40s |
| Cavalry | 40 | 10 | 30s |
| **Buildings** | — | — | — |
| Farm | 20 | 50 | 25s |
| Lumber Mill | 30 | 70 | 35s |
| Gold Mine | 50 | 20 | 40s |
| Fortress | 150 | 100 | 60s |

### Creating Wreckage

**From Unit Death**:
```typescript
const wreckage = gameManager.createWreckageFromUnit(deadUnit);
// Wreckage appears at unit's last position
```

**From Building Destruction**:
```typescript
const wreckage = gameManager.createWreckageFromBuilding(destroyedBuilding);
// Building wreckage worth 150 metal + 100 wood
```

### Worker Scrap Collection

```typescript
gameManager.commandWorkerToScrap(workerEntity, wreckageId);
// Worker walks to wreckage and begins recovery
```

**Process**:
1. Worker pathed to wreckage location
2. Worker enters "gathering" state at wreckage
3. Resources recovered per second: buildSpeed × 1.5
4. Worker carries recovered metal/wood
5. Worker deposits at nearest town center

### Wreckage Report

```typescript
const wreckage = gameManager.getWreckageReport();
// Returns: {
//   id, type, faction, recovery (%), x, y
// }[]
```

### Strategic Gameplay

Wreckage creates economic depth:
- Destroyed armies leave resources to reclaim
- Risk/reward of pushing into enemy territory
- Encourages patrol and defense of battle sites
- Late-game scavenging economy

---

## Animation System

### Overview

The Animation System manages sprite frame animations for units, buildings, and effects. Supports named animations with configurable frame counts and durations.

### Standard Animations

#### Worker
- **idle**: 4 frames, 1.0s (standing)
- **walk**: 8 frames, 0.8s (movement)
- **gather**: 6 frames, 1.2s (harvesting)
- **build**: 5 frames, 1.5s (construction)
- **death**: 4 frames, 0.5s (dying)

#### Soldier
- **idle**: 2 frames, 0.8s
- **walk**: 8 frames, 0.6s
- **attack**: 4 frames, 0.4s
- **death**: 5 frames, 0.6s

#### Archer
- **idle**: 2 frames, 0.8s
- **walk**: 8 frames, 0.7s
- **attack**: 6 frames, 0.5s
- **reload**: 3 frames, 0.4s
- **death**: 4 frames, 0.5s

#### Catapult
- **idle**: 1 frame, 1.0s (stationary)
- **aim**: 3 frames, 0.6s
- **fire**: 2 frames, 0.3s
- **reload**: 4 frames, 1.2s

### Playing Animations

```typescript
gameManager.playAnimation(entity, 'walk', true);
// animationName: 'idle', 'walk', 'attack', 'death', etc
// loop: true = repeats, false = plays once
```

### Stopping Animations

```typescript
gameManager.stopAnimation(entity);
// Freezes on current frame
```

### Death Animation

```typescript
animationSystem.playDeathAnimation(entity);
// Plays death sequence non-looping
// Entity can be removed after animation completes
```

### Custom Animations

Define new animations in AnimationSystem:

```typescript
private registerAnimation(name: string, frameCount: number, durationMs: number) {
  this.animations.set(name, {
    frames: frameCount,
    duration: durationMs / 1000
  });
}
```

### Animation States

```typescript
interface AnimationState {
  currentAnimation: string | null;
  isPlaying: boolean;
  currentFrame: number;
  frameCount: number;
}
```

---

## Component Reference

### Advanced Components

#### Projectile

```typescript
export class Projectile {
  // Ownership
  ownerId: number;
  ownerFaction: string;
  damage: number;

  // Physics
  initialVelocity: number;
  currentVelocityX: number;
  currentVelocityY: number;
  acceleration: number; // Gravity
  drag: number; // Air resistance
  mass: number;

  // Targeting
  targetX: number;
  targetY: number;
  targetEntityId: number | null;

  // State
  traveled: number;
  lifetime: number;
  hasHit: boolean;
  impact: boolean;

  // Properties
  radius: number; // Collision radius
  splashRadius: number; // AoE radius
  piercing: number; // Pierce damage

  // Methods
  update(deltaTime: number): void;
  getTrajectory(deltaTime: number): { x: number; y: number };
  getImpactDamage(): number;
  static calculateLaunchAngle(distance, velocity, gravity): number;
}
```

#### Morale

```typescript
export class Morale {
  current: number; // 0-100
  max: number;
  fearThreshold: number; // Default: 30
  rageThreshold: number; // Default: 80

  damageMultiplier: number;
  speedMultiplier: number;
  accuracyMultiplier: number;
  armorMultiplier: number;

  state: 'broken' | 'fearful' | 'normal' | 'steadfast' | 'fervor';
  unitsNearby: number;

  // Methods
  update(deltaTime: number): void;
  takeCasualty(): void;
  witnessVictory(enemyCount: number): void;
  boostFromHero(): void;
}
```

#### Naval

```typescript
export class Naval {
  type: 'transport' | 'warship' | 'explorer';
  capacity: number;
  cargo: number[]; // Entity IDs
  speed: number;
  canFireWhileMoving: boolean;

  // Methods
  canLoadUnit(): boolean;
  loadUnit(unitId: number): boolean;
  unloadUnit(unitId: number): boolean;
  isFullyLoaded(): boolean;
}
```

#### Wreckage

```typescript
export class Wreckage {
  type: string;
  faction: string;
  metalContent: number;
  woodContent: number;
  resourceValue: { type: string; amount: number }[];
  retrievalProgress: number;
  isRecovered: boolean;

  // Methods
  recover(amount: number): void;
}
```

#### Animation

```typescript
export class Animation {
  currentFrame: number;
  frameTime: number;
  frameDuration: number;
  frameCount: number;
  isLooping: boolean;
  isPlaying: boolean;

  currentAnimation: string | null;
  animations: Map<string, { frames: number; duration: number }>;

  // Methods
  registerAnimation(name: string, frameCount: number, duration: number): void;
  playAnimation(name: string, loop?: boolean): boolean;
  update(deltaTime: number): void;
}
```

---

## System Integration

All systems are initialized in GameManager and updated in the correct order:

1. **MovementSystem** - Physics and velocity
2. **CollisionSystem** - Boundary checking
3. **WorkerSystem** - Unit automation
4. **AnimationSystem** - Sprite frames
5. **MoraleSystem** - Unit morale effects
6. **NavalSystem** - Ship movement and loading
7. **CombatSystem** - Projectiles and impacts
8. **WrackageSystem** - Scrap collection
9. **RendererSystem** - Visual output

This ordering ensures dependencies are satisfied and state is consistent.

---

## Example: Full Combat Sequence

```typescript
// 1. Create combatants
const archer = gameManager.createArcher('solar_kingdom', 100, 100);
const soldier = gameManager.createSoldier('iron_horde', 300, 100);

// 2. Play attack animation
gameManager.playAnimation(archer, 'attack', false);

// 3. Fire projectile
gameManager.fireProjectile(archer, soldier, 6, 0);

// 4. Projectile travels with physics
// - Gravity pulls it down
// - Air drag reduces velocity
// - Distance reduces final damage

// 5. Check hit
const hits = gameManager.getCombatLog();
// { projectileId: 1, targetId: 2, damage: 5.8 }

// 6. Morale effects
gameManager.recordVictory('solar_kingdom', 1);
// Archer morale increases

// 7. If soldier dies
gameManager.recordUnitDeath('iron_horde');
gameManager.createWreckageFromUnit(soldier);
// Wreckage appears, morale drops for remaining iron horde units
```

---

## Performance Considerations

- **Projectile Culling**: Remove projectiles after 10s lifetime
- **Morale Checks**: Run every frame, O(n²) for aura radius
- **Naval Pathfinding**: Uses same A* as land units
- **Wreckage Cleanup**: Auto-remove fully recovered wreckage
- **Animation Batching**: All animations updated in single system pass

---

*Last updated: 2026-04-23*
*Empires RTS v0.2*
