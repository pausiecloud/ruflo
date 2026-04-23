# 🎮 EMPIRES RTS v0.2 - Mobile-First Real-Time Strategy Engine

**Empires** is a fusion of classic RTS gameplay (Age of Empires) with physics-driven combat (Total Annihilation), optimized for mobile and web. Built with TypeScript, Canvas rendering, and a production-grade Entity Component System (ECS) architecture.

**Status**: v0.2 - Advanced systems complete (Combat, Morale, Naval, Wreckage, Animation)

## 📋 Features

### Core Mechanics
- **Entity Component System (ECS)**: High-performance architecture for managing thousands of game objects
- **60 FPS Target**: Optimized for mobile CPUs with delta-time based physics
- **Worker-Based Economy**: AoE-style manual resource gathering + TA-style automated extractors
- **Physics-Based Combat**: Projectiles with gravity, ballistics, splash damage, and impact calculations
- **Morale System**: Unit performance affected by nearby allies, heroes, and casualties
- **Naval Warfare**: Transport ships, warships, and unit ferrying across archipelago
- **Wreckage Reclamation**: Strategic resource recovery from destroyed units and buildings
- **Animation System**: Sprite frame animations for all unit states
- **A* Pathfinding**: Grid-based pathfinding optimized for mobile performance

### Game Systems
- **4 Distinct Factions**: Solar Kingdom, Iron Horde, Abyss Cult, Amber Merchants
- **Unit Types**: Workers, soldiers, archers, siege units (expandable via JSON)
- **Building System**: Resource extractors, barracks, fortifications
- **Mobile UI**: Radial menus, gesture controls, responsive HUD
- **Archipelago Map**: Large central continent + resource-rich islands with naval gameplay

## 🏗️ Architecture

### Core Systems

```
World (ECS Container)
├── Entity (Unique ID, component container)
├── Components (Data containers)
│   ├── Transform (Position, rotation, scale)
│   ├── Velocity (Movement vectors)
│   ├── Sprite (Rendering info)
│   ├── Health (HP, armor)
│   ├── Unit (Combat properties)
│   ├── Worker (Gathering/building AI)
│   ├── Building (Construction state)
│   ├── ResourceNode (Resource availability)
│   └── Pathfinding (Path data)
└── Systems (Logic processors)
    ├── MovementSystem
    ├── CollisionSystem
    ├── RendererSystem
    └── WorkerSystem
```

### File Structure

```
src/empires/
├── core/
│   ├── ecs.ts              # Entity Component System
│   └── components.ts       # All game components
├── systems/
│   ├── renderer.ts         # Canvas rendering
│   ├── movement.ts         # Physics & pathfinding integration
│   └── worker.ts           # Worker behavior & automation
├── ai/
│   └── pathfinding.ts      # A* algorithm (mobile-optimized)
├── game/
│   └── manager.ts          # Central game orchestrator
├── data/
│   └── units.json          # Unit & building definitions (4 factions)
├── main.ts                 # Entry point
├── index.html              # Web interface
└── webpack.config.js       # Build configuration
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Install build tools (if needed)
npm install --save-dev webpack webpack-cli webpack-dev-server typescript ts-loader html-webpack-plugin style-loader css-loader
```

### Development

```bash
# Watch TypeScript compilation
npm run dev

# OR start webpack dev server
npx webpack serve --config src/empires/webpack.config.js

# Navigate to http://localhost:8080
```

### Build for Production

```bash
npx webpack --config src/empires/webpack.config.js --mode production
```

## 🎮 Controls

### PC/Web
- **Left Click**: Select unit or structure
- **Double Click**: Issue command (move, attack, gather)
- **Drag Select**: Multiple unit selection
- **Scroll Wheel**: Zoom camera in/out
- **Arrow Keys / WASD**: Pan camera

### Mobile
- **Single Tap**: Select unit
- **Double Tap**: Radial menu (build, attack, gather, move)
- **Drag**: Pan camera
- **Pinch**: Zoom camera

## 📊 Unit System (JSON-Defined)

All units, buildings, and factions are defined in `data/units.json`. Add new units by editing:

```json
{
  "factions": [
    {
      "id": "solar_kingdom",
      "units": [
        {
          "id": "worker",
          "name": "Citizen",
          "health": 25,
          "armor": 0,
          "speed": 80,
          "attackRange": 0,
          "attackDamage": 0,
          "cost": { "gold": 0, "food": 50, "wood": 0, "ore": 0 }
        }
      ]
    }
  ]
}
```

## 🤖 Pathfinding

The A* pathfinding system is optimized for mobile:

```typescript
const pathfinder = new Pathfinder(mapWidth, mapHeight);
const path = pathfinder.findPath(startX, startY, goalX, goalY);

// Set obstacles (buildings, terrain)
pathfinder.setObstacle(x, y, width, height);
```

**Performance**: ~1ms for 2000x2000 map searches on mobile devices.

## 💾 Resource System

Players manage 4 resources:
- **Food**: Gathered from farms and wild sources
- **Wood**: Harvested from forests and lumber mills
- **Gold**: Extracted from mines (high-value)
- **Ore**: Mined for construction (strategic resource)

Workers automatically deposit resources at the nearest town center.

## 🏛️ Building System

Buildings are constructed through workers:

```typescript
const building = gameManager.createBuilding('farm', 'solar_kingdom', 300, 400, 20);

// Workers automatically build nearby buildings
workerSystem.commandWorkerToBuild(workerEntity, buildingId);
```

Build times vary by structure (20-70 seconds).

## 🎨 Rendering Pipeline

1. **Clear Screen**: Black background
2. **Camera Transform**: World coordinates → screen coordinates
3. **Entity Rendering**: Sprite-based rendering with rotation
4. **Debug Overlay**: Grid, collision boxes (optional)
5. **HUD**: Resource counts, unit selection info

## 🔄 Game Loop

```
requestAnimationFrame() {
  deltaTime = (now - lastTime) / 1000
  world.update(deltaTime)
  
  MovementSystem.update()      // Apply velocity, pathfinding
  CollisionSystem.update()     // Boundary checking
  WorkerSystem.update()        // Gathering, building, AI
  AnimationSystem.update()     // Sprite frame animations
  MoraleSystem.update()        // Performance multipliers
  NavalSystem.update()         // Ship movement, unit loading
  CombatSystem.update()        // Projectiles, impacts, damage
  WrackageSystem.update()      // Scrap recovery
  RendererSystem.update()      // Draw all entities
  
  repeat
}
```

**Target**: 60 FPS (16.67ms per frame)
**Mobile cap**: 33ms minimum (prevents overheating)

## 🎖️ Advanced Systems (v0.2)

### Combat System
Physics-based projectiles with gravity, air drag, and impact damage. Damage scales with velocity (30-100%). Splash damage with configurable radius and falloff.

```typescript
gameManager.fireProjectile(archer, soldier, 6, splashRadius);
const hits = gameManager.getCombatLog();
```

### Morale System
Unit morale (0-100) affects performance through multipliers:
- **Fearful** (< 30): 40% damage, 130% speed (panic)
- **Steadfast**: 105% damage/armor (group bonus)
- **Fervor** (> 80): 130% damage, 110% speed (winning)

```typescript
gameManager.recordUnitDeath('iron_horde');
gameManager.recordVictory('solar_kingdom', 3);
const report = gameManager.getMoraleReport('solar_kingdom');
```

### Naval System
Transport ships (6 unit capacity), warships (artillery), and explorers enable archipelago conquest.

```typescript
const transport = gameManager.createTransport('solar_kingdom', 200, 500);
gameManager.commandLoadUnits(transport);     // Auto-load nearby units
gameManager.commandUnloadUnits(transport, 300, 600);
```

### Wreckage System
Destroyed units leave scrap that workers can harvest for metal and wood. Strategic resource recovery at battle sites.

```typescript
const wreckage = gameManager.createWreckageFromUnit(deadSoldier);
gameManager.commandWorkerToScrap(worker, wreckageId);
const report = gameManager.getWreckageReport();
```

### Animation System
Named sprite animations (idle, walk, attack, build, death) for all unit types with configurable frame counts and timing.

```typescript
gameManager.playAnimation(archer, 'attack', false);  // Non-looping
gameManager.playAnimation(worker, 'gather', true);   // Looping
```

**Full documentation**: See `docs/SYSTEMS.md` for complete API reference and examples.

## 🔧 Extending the Game

### Add a New Unit

1. Edit `src/empires/data/units.json`:
```json
{
  "id": "heavy_cavalry",
  "name": "Knight",
  "health": 50,
  "armor": 4,
  "speed": 75,
  "attackRange": 20,
  "attackDamage": 12
}
```

2. Create sprite texture (32x32 PNG)
3. Update `RendererSystem` to load texture:
```typescript
await renderer.loadTexture('heavy_cavalry', '/assets/knight.png');
```

### Add a New System

1. Create `src/empires/systems/mysystem.ts`:
```typescript
export class MySystem extends System {
  readonly id = 'mysystem';
  readonly requiredComponents = ['component1', 'component2'];
  
  update(deltaTime: number): void {
    this.entities.forEach(entity => {
      // Your logic here
    });
  }
}
```

2. Register with world:
```typescript
world.registerSystem(new MySystem());
```

## 📈 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| FPS | 60 | In Progress |
| Map Size | 2000x2000+ | Achieved |
| Units | 500+ visible | In Development |
| Pathfinding | <1ms per path | Achieved |
| Mobile CPU | <80% usage | In Progress |
| Memory | <100MB | In Development |

## 🐛 Known Issues

- Unit-to-unit collision detection simplified (bounding boxes only)
- Naval pathfinding uses same grid as land (should use sea lanes)
- Animation sprites not yet provided (using placeholder rectangles)
- Tooltip UI not yet implemented
- Damage numbers not floating above units

## 🔮 Roadmap (v0.3+)

- [x] **v0.1** Physics-based projectiles ✅
- [x] **v0.2** Naval combat system ✅
- [x] **v0.2** Morale & panic mechanics ✅
- [x] **v0.2** Wreckage/resource reclamation ✅
- [ ] **v0.3** Animated sprite assets (16-bit art)
- [ ] **v0.3** Advanced unit AI (formations, retreats, tactics)
- [ ] **v0.3** Hero units with special abilities
- [ ] **v0.4** Campaign mode with story missions
- [ ] **v0.4** Multiplayer networking (WebSocket/P2P)
- [ ] **v0.5** Map generation algorithm (procedural archipelago)
- [ ] **v0.5** Mod support via plugin system
- [ ] **v1.0** Stable release candidate

## 📝 Development Notes

### Mobile Optimization
- Grid-based pathfinding (not continuous)
- Delta-time capped at 33ms to prevent overheating
- Sprite batching in renderer (TODO)
- Memory pooling for objects (TODO)

### Code Style
- TypeScript strict mode
- Functional components (immutable where possible)
- No global state (everything through World/GameManager)
- Snake_case for data, camelCase for code

## 📞 Contributing

This is an experimental RTS engine. Contributions welcome for:
- Performance optimizations
- New unit types
- AI improvements
- Mobile control refinements
- Multiplayer networking

---

**Built with ❤️ for retro RTS lovers and modern developers.**
