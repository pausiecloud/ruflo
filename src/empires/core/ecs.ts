/**
 * Entity Component System (ECS) - Core Architecture for Empires RTS
 * Optimized for high-frequency updates (60fps) on mobile
 */

export type ComponentId = string;
export type EntityId = number;
export type SystemId = string;

export interface Component {
  readonly id: ComponentId;
}

export class Entity {
  id: EntityId;
  private components: Map<ComponentId, Component> = new Map();

  constructor(id: EntityId) {
    this.id = id;
  }

  addComponent<T extends Component>(component: T): T {
    this.components.set(component.id, component);
    return component;
  }

  getComponent<T extends Component>(id: ComponentId): T | undefined {
    return this.components.get(id) as T | undefined;
  }

  hasComponent(id: ComponentId): boolean {
    return this.components.has(id);
  }

  removeComponent(id: ComponentId): void {
    this.components.delete(id);
  }

  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }
}

export abstract class System {
  protected entities: Map<EntityId, Entity> = new Map();

  abstract readonly id: SystemId;
  abstract readonly requiredComponents: ComponentId[];

  addEntity(entity: Entity): void {
    if (this.isEntityValid(entity)) {
      this.entities.set(entity.id, entity);
    }
  }

  removeEntity(id: EntityId): void {
    this.entities.delete(id);
  }

  protected isEntityValid(entity: Entity): boolean {
    return this.requiredComponents.every((id) => entity.hasComponent(id));
  }

  abstract update(deltaTime: number): void;
}

export class World {
  private entities: Map<EntityId, Entity> = new Map();
  private systems: Map<SystemId, System> = new Map();
  private nextEntityId: EntityId = 1;
  private deltaTime: number = 0;

  createEntity(): Entity {
    const entity = new Entity(this.nextEntityId++);
    this.entities.set(entity.id, entity);
    return entity;
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  destroyEntity(id: EntityId): void {
    this.entities.delete(id);
    this.systems.forEach((system) => system.removeEntity(id));
  }

  registerSystem(system: System): void {
    this.systems.set(system.id, system);
    this.entities.forEach((entity) => system.addEntity(entity));
  }

  update(dt: number): void {
    this.deltaTime = dt;
    this.systems.forEach((system) => system.update(dt));
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }
}
