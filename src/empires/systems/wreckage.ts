import { System, Entity, World } from '../core/ecs';
import { Transform, Health, Sprite, Unit, Worker } from '../core/components';
import { Wreckage } from '../core/components-advanced';

/**
 * Wreckage System - Manages destroyed units, scrap reclamation, and resource recovery
 * When units die, they leave wreckage that workers can reclaim for metal/resources
 */
export class WrackageSystem extends System {
  readonly id = 'wreckage';
  readonly requiredComponents = ['wreckage', 'transform'];

  private world: World;
  private wreckageValues: Map<string, { metal: number; wood: number }> = new Map();

  constructor(world: World) {
    super();
    this.world = world;
    this.initializeWreckageValues();
  }

  private initializeWreckageValues(): void {
    // Define how much resources come from each unit type
    this.wreckageValues.set('worker', { metal: 15, wood: 10 });
    this.wreckageValues.set('soldier', { metal: 25, wood: 5 });
    this.wreckageValues.set('archer', { metal: 20, wood: 15 });
    this.wreckageValues.set('catapult', { metal: 60, wood: 30 });
    this.wreckageValues.set('cavalry', { metal: 40, wood: 10 });

    // Buildings leave more scrap
    this.wreckageValues.set('farm', { metal: 20, wood: 50 });
    this.wreckageValues.set('lumber_mill', { metal: 30, wood: 70 });
    this.wreckageValues.set('gold_mine', { metal: 50, wood: 20 });
    this.wreckageValues.set('fortress', { metal: 150, wood: 100 });
  }

  update(deltaTime: number): void {
    this.entities.forEach((entity) => {
      const wreckage = entity.getComponent<Wreckage>('wreckage');
      if (!wreckage) return;

      // Check if wreckage has been fully recovered
      const resources = this.wreckageValues.get(wreckage.type) || { metal: 10, wood: 10 };
      const totalValue = resources.metal + resources.wood;

      if (wreckage.retrievalProgress >= totalValue) {
        wreckage.isRecovered = true;
        // Mark for deletion in game manager
      }
    });
  }

  /**
   * Converts a destroyed unit into wreckage
   */
  createWreckageFromUnit(unitEntity: Entity): Entity | null {
    const transform = unitEntity.getComponent<Transform>('transform');
    const unit = unitEntity.getComponent<Unit>('unit');

    if (!transform || !unit) return null;

    // Create wreckage entity
    const wreckageEntity = this.world.createEntity();

    const wreckageComponent = new Wreckage(unit.type, unit.faction);

    // Set resource values based on unit type
    const values = this.wreckageValues.get(unit.type) || { metal: 10, wood: 10 };
    wreckageComponent.metalContent = values.metal;
    wreckageComponent.woodContent = values.wood;

    wreckageEntity.addComponent(new Transform(transform.x, transform.y));
    wreckageEntity.addComponent(
      new Sprite('wreckage', 48, 48) // Wreckage has different sprite
    );
    wreckageEntity.addComponent(wreckageComponent);

    // Add to system
    this.addEntity(wreckageEntity);

    return wreckageEntity;
  }

  /**
   * Creates wreckage from a destroyed building
   */
  createWreckageFromBuilding(buildingEntity: Entity): Entity | null {
    const transform = buildingEntity.getComponent<Transform>('transform');

    if (!transform) return null;

    const wreckageEntity = this.world.createEntity();

    // Create building wreckage with much higher resource value
    const wreckage = new Wreckage('building', 'neutral');

    wreckageEntity.addComponent(new Transform(transform.x, transform.y));
    wreckageEntity.addComponent(new Sprite('building_wreckage', 64, 64));
    wreckageEntity.addComponent(wreckage);

    this.addEntity(wreckageEntity);

    return wreckageEntity;
  }

  /**
   * Worker commands to start scrap collection
   */
  commandWorkerToScrap(workerEntity: Entity, wreckageId: number): boolean {
    const worker = workerEntity.getComponent<Worker>('worker');
    if (!worker) return false;

    // Set worker task to scrap collection
    worker.targetResourceId = wreckageId; // Reuse as target
    worker.state = 'gathering'; // Will gather resources
    worker.resourceType = 'metal'; // Primary scrap resource

    return true;
  }

  /**
   * Updates wreckage based on worker recovery
   */
  updateWreckageRecovery(wreckageEntity: Entity, recoveryAmount: number): void {
    const wreckage = wreckageEntity.getComponent<Wreckage>('wreckage');
    if (!wreckage) return;

    wreckage.recover(recoveryAmount);
  }

  /**
   * Gets resources from wreckage based on recovery progress
   */
  getRecoveredResources(wreckageEntity: Entity): { metal: number; wood: number } {
    const wreckage = wreckageEntity.getComponent<Wreckage>('wreckage');
    if (!wreckage) return { metal: 0, wood: 0 };

    // Resources are recovered proportionally
    const recoveryFraction = wreckage.retrievalProgress / (wreckage.metalContent + wreckage.woodContent);
    const metalRecovered = Math.floor(wreckage.metalContent * recoveryFraction);
    const woodRecovered = Math.floor(wreckage.woodContent * recoveryFraction);

    return { metal: metalRecovered, wood: woodRecovered };
  }

  /**
   * Cleanup - marks wreckage for deletion after recovery
   */
  removeWreckage(wreckageId: number): void {
    this.removeEntity(wreckageId);
  }

  /**
   * Get all wreckage on map
   */
  getWreckageReport(): Array<{
    id: number;
    type: string;
    faction: string;
    recovery: number;
    x: number;
    y: number;
  }> {
    const report: Array<{
      id: number;
      type: string;
      faction: string;
      recovery: number;
      x: number;
      y: number;
    }> = [];

    this.entities.forEach((entity) => {
      const wreckage = entity.getComponent<Wreckage>('wreckage');
      const transform = entity.getComponent<Transform>('transform');

      if (wreckage && transform) {
        const totalValue = wreckage.metalContent + wreckage.woodContent;
        const recoveryPercent = (wreckage.retrievalProgress / totalValue) * 100;

        report.push({
          id: entity.id,
          type: wreckage.type,
          faction: wreckage.faction,
          recovery: recoveryPercent,
          x: transform.x,
          y: transform.y,
        });
      }
    });

    return report;
  }
}
