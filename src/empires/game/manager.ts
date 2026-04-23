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
import { RendererSystem } from '../systems/renderer';
import { MovementSystem, CollisionSystem } from '../systems/movement';
import { WorkerSystem } from '../systems/worker';
import { Pathfinder } from '../ai/pathfinding';

export class GameManager {
  private world: World;
  private renderer: RendererSystem;
  private movementSystem: MovementSystem;
  private collisionSystem: CollisionSystem;
  private workerSystem: WorkerSystem;
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
    this.pathfinder = new Pathfinder(this.mapWidth, this.mapHeight);

    // Register systems with world
    this.world.registerSystem(this.movementSystem);
    this.world.registerSystem(this.collisionSystem);
    this.world.registerSystem(this.workerSystem);
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

    this.movementSystem.addEntity(entity);
    this.workerSystem.addEntity(entity);
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

    this.movementSystem.addEntity(entity);
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

  getWorld(): World {
    return this.world;
  }
}
