import { World, Entity } from '../core/ecs';
import {
  Transform,
  Velocity,
  Sprite,
  Health,
  Unit,
  Worker,
  Building,
  ResourceNode,
  Team,
  Pathfinding,
} from '../core/components';
import {
  Projectile,
  Morale,
  Naval,
  Animation,
  Wreckage,
} from '../core/components-advanced';
import { RendererSystem } from '../systems/renderer';
import { MovementSystem, CollisionSystem } from '../systems/movement';
import { WorkerSystem } from '../systems/worker';
import { CombatSystem } from '../systems/combat';
import { MoraleSystem } from '../systems/morale';
import { NavalSystem } from '../systems/naval';
import { WrackageSystem } from '../systems/wreckage';
import { AnimationSystem } from '../systems/animation';
import { Pathfinder } from '../ai/pathfinding';

export class GameManager {
  private world: World;
  private renderer: RendererSystem;
  private movementSystem: MovementSystem;
  private collisionSystem: CollisionSystem;
  private workerSystem: WorkerSystem;
  private combatSystem: CombatSystem;
  private moraleSystem: MoraleSystem;
  private navalSystem: NavalSystem;
  private wrackageSystem: WrackageSystem;
  private animationSystem: AnimationSystem;
  private pathfinder: Pathfinder;

  private lastTime: number = Date.now();
  private isRunning: boolean = false;
  private gameLoopId: number | null = null;

  private mapWidth: number = 2000;
  private mapHeight: number = 2000;

  constructor(canvasElement: HTMLCanvasElement) {
    this.world = new World();

    // Initialize systems
    this.renderer = new RendererSystem(canvasElement);
    this.movementSystem = new MovementSystem();
    this.collisionSystem = new CollisionSystem();
    this.workerSystem = new WorkerSystem();
    this.combatSystem = new CombatSystem();
    this.moraleSystem = new MoraleSystem();
    this.navalSystem = new NavalSystem();
    this.wrackageSystem = new WrackageSystem(this.world);
    this.animationSystem = new AnimationSystem();
    this.pathfinder = new Pathfinder(this.mapWidth, this.mapHeight);

    // Register systems with world (order matters for dependencies)
    this.world.registerSystem(this.movementSystem);
    this.world.registerSystem(this.collisionSystem);
    this.world.registerSystem(this.workerSystem);
    this.world.registerSystem(this.animationSystem);
    this.world.registerSystem(this.moraleSystem);
    this.world.registerSystem(this.navalSystem);
    this.world.registerSystem(this.combatSystem);
    this.world.registerSystem(this.wrackageSystem);
    this.world.registerSystem(this.renderer);

    this.collisionSystem.setMapBounds(this.mapWidth, this.mapHeight);

    this.setupInputHandlers(canvasElement);
  }

  private setupInputHandlers(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('click', (e) => this.handleCanvasClick(e, canvas));
    canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e, canvas));
    canvas.addEventListener('wheel', (e) => this.handleZoom(e));
  }

  private handleCanvasClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // TODO: Implement unit selection and contextual commands
  }

  private handleDoubleClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // TODO: Implement double-tap action (build, attack, etc.)
  }

  private handleZoom(event: WheelEvent): void {
    event.preventDefault();
    // TODO: Implement camera zoom
  }

  start(): void {
    this.isRunning = true;
    this.lastTime = Date.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
    }
  }

  private gameLoop(): void {
    const currentTime = Date.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.033); // Cap at 33ms (30fps min)
    this.lastTime = currentTime;

    // Update world
    this.world.update(deltaTime);

    // Continue loop
    if (this.isRunning) {
      this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }
  }

  // Entity creation helpers
  createWorker(faction: string, x: number, y: number): Entity {
    const entity = this.world.createEntity();

    entity.addComponent(new Transform(x, y));
    entity.addComponent(new Velocity(0, 0));
    entity.addComponent(new Sprite(`worker_${faction}`, 32, 32));
    entity.addComponent(new Health(25, 0));
    entity.addComponent(new Unit('worker', faction, 80, 0, 0));
    entity.addComponent(new Worker());
    entity.addComponent(new Pathfinding());
    entity.addComponent(new Morale());
    entity.addComponent(new Animation(4, 1.0));

    this.movementSystem.addEntity(entity);
    this.workerSystem.addEntity(entity);
    this.moraleSystem.addEntity(entity);
    this.animationSystem.addEntity(entity);
    this.renderer.addEntity(entity);

    return entity;
  }

  createSoldier(faction: string, x: number, y: number): Entity {
    const entity = this.world.createEntity();

    entity.addComponent(new Transform(x, y));
    entity.addComponent(new Velocity(0, 0));
    entity.addComponent(new Sprite(`soldier_${faction}`, 32, 32));
    entity.addComponent(new Health(35, 2));
    entity.addComponent(new Unit('soldier', faction, 70, 16, 8));
    entity.addComponent(new Pathfinding());
    entity.addComponent(new Morale());
    entity.addComponent(new Animation(8, 0.6));

    this.movementSystem.addEntity(entity);
    this.moraleSystem.addEntity(entity);
    this.combatSystem.registerTargetableEntity(entity);
    this.animationSystem.addEntity(entity);
    this.renderer.addEntity(entity);

    return entity;
  }

  createArcher(faction: string, x: number, y: number): Entity {
    const entity = this.world.createEntity();

    entity.addComponent(new Transform(x, y));
    entity.addComponent(new Velocity(0, 0));
    entity.addComponent(new Sprite(`archer_${faction}`, 32, 32));
    entity.addComponent(new Health(20, 0));
    entity.addComponent(new Unit('archer', faction, 60, 80, 6));
    entity.addComponent(new Pathfinding());
    entity.addComponent(new Morale());
    entity.addComponent(new Animation(8, 0.7));

    this.movementSystem.addEntity(entity);
    this.moraleSystem.addEntity(entity);
    this.combatSystem.registerTargetableEntity(entity);
    this.animationSystem.addEntity(entity);
    this.renderer.addEntity(entity);

    return entity;
  }

  createTransport(faction: string, x: number, y: number): Entity {
    const entity = this.world.createEntity();

    entity.addComponent(new Transform(x, y));
    entity.addComponent(new Velocity(0, 0));
    entity.addComponent(new Sprite(`transport_${faction}`, 64, 48));
    entity.addComponent(new Health(100, 3));
    entity.addComponent(new Unit('transport', faction, 80, 0, 0));
    entity.addComponent(new Naval('transport', 6));
    entity.addComponent(new Pathfinding());

    this.movementSystem.addEntity(entity);
    this.navalSystem.addEntity(entity);
    this.renderer.addEntity(entity);

    return entity;
  }

  createWarship(faction: string, x: number, y: number): Entity {
    const entity = this.world.createEntity();

    entity.addComponent(new Transform(x, y));
    entity.addComponent(new Velocity(0, 0));
    entity.addComponent(new Sprite(`warship_${faction}`, 64, 48));
    entity.addComponent(new Health(200, 5));
    entity.addComponent(new Unit('warship', faction, 60, 200, 20));
    entity.addComponent(new Naval('warship', 0));
    entity.addComponent(new Pathfinding());

    this.movementSystem.addEntity(entity);
    this.navalSystem.addEntity(entity);
    this.combatSystem.registerTargetableEntity(entity);
    this.renderer.addEntity(entity);

    return entity;
  }

  createResourceNode(type: 'food' | 'wood' | 'gold' | 'ore', x: number, y: number, amount: number): Entity {
    const entity = this.world.createEntity();

    entity.addComponent(new Transform(x, y));
    entity.addComponent(new Sprite(`resource_${type}`, 48, 48));
    entity.addComponent(new ResourceNode(type, amount));

    this.renderer.addEntity(entity);
    this.workerSystem.registerResourceNode(entity.id, entity);

    return entity;
  }

  createBuilding(type: string, faction: string, x: number, y: number, buildTime: number): Entity {
    const entity = this.world.createEntity();

    entity.addComponent(new Transform(x, y));
    entity.addComponent(new Sprite(`building_${type}`, 64, 64));
    entity.addComponent(new Health(200, 2));
    entity.addComponent(new Building(type, faction, buildTime));

    this.renderer.addEntity(entity);
    this.workerSystem.registerBuilding(entity.id, entity);

    return entity;
  }

  // Camera and rendering methods
  setCameraPosition(x: number, y: number, zoom: number = 1): void {
    this.renderer.setCamera(x, y, zoom);
  }

  // Pathfinding
  findPath(startX: number, startY: number, goalX: number, goalY: number): Array<{ x: number; y: number }> {
    return this.pathfinder.findPath(startX, startY, goalX, goalY);
  }

  // Worker commands
  commandWorkerToGather(entity: Entity, resourceId: number): void {
    this.workerSystem.commandWorkerToGather(entity, resourceId);
    const path = this.findPath(
      entity.getComponent<Transform>('transform')?.x || 0,
      entity.getComponent<Transform>('transform')?.y || 0,
      0, // TODO: Get resource position
      0
    );
    const pathfinding = entity.getComponent<Pathfinding>('pathfinding');
    if (pathfinding && path.length > 0) {
      pathfinding.setPath(path);
    }
  }

  commandWorkerToBuild(entity: Entity, buildingId: number): void {
    this.workerSystem.commandWorkerToBuild(entity, buildingId);
  }

  // Map generation and obstacles
  setMapObstacle(x: number, y: number, width: number, height: number): void {
    this.pathfinder.setObstacle(x, y, width, height);
  }

  // Combat API
  fireProjectile(attacker: Entity, target: Entity | null, damage: number, splashRadius: number = 0): void {
    this.combatSystem.createProjectile(attacker, target, damage, splashRadius);
  }

  getCombatLog(): Array<{ projectileId: number; targetId: number; damage: number }> {
    return this.combatSystem.getHitLog();
  }

  // Morale API
  recordUnitDeath(faction: string): void {
    this.moraleSystem.recordUnitDeath(faction);
  }

  recordVictory(faction: string, enemyCount: number): void {
    this.moraleSystem.recordVictory(faction, enemyCount);
  }

  getMoraleReport(faction: string): {
    averageMorale: number;
    unitCount: number;
    fearfulCount: number;
    fervorCount: number;
    casualtyRate: number;
  } {
    return this.moraleSystem.getMoraleReport(faction);
  }

  applyHeroAura(heroPower?: number): void {
    this.moraleSystem.applyHeroAura(heroPower);
  }

  // Naval API
  commandLoadUnits(shipEntity: Entity): void {
    this.navalSystem.commandLoadUnits(shipEntity);
  }

  commandUnloadUnits(shipEntity: Entity, destX: number, destY: number): void {
    this.navalSystem.commandUnloadUnits(shipEntity, destX, destY);
  }

  getFleetStatus(): Array<{ shipId: number; type: string; cargo: number; capacity: number }> {
    return this.navalSystem.getFleetStatus();
  }

  // Wreckage API
  createWreckageFromUnit(unitEntity: Entity): Entity | null {
    return this.wrackageSystem.createWreckageFromUnit(unitEntity);
  }

  createWreckageFromBuilding(buildingEntity: Entity): Entity | null {
    return this.wrackageSystem.createWreckageFromBuilding(buildingEntity);
  }

  commandWorkerToScrap(workerEntity: Entity, wreckageId: number): boolean {
    return this.wrackageSystem.commandWorkerToScrap(workerEntity, wreckageId);
  }

  getWreckageReport(): Array<{
    id: number;
    type: string;
    faction: string;
    recovery: number;
    x: number;
    y: number;
  }> {
    return this.wrackageSystem.getWreckageReport();
  }

  // Animation API
  playAnimation(entity: Entity, animationName: string, loop?: boolean): boolean {
    return this.animationSystem.playAnimation(entity, animationName, loop);
  }

  stopAnimation(entity: Entity): void {
    this.animationSystem.stopAnimation(entity);
  }

  getWorld(): World {
    return this.world;
  }
}
