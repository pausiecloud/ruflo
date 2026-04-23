import { System } from '../core/ecs';
import { Worker, Transform, ResourceNode, Building, Team, Pathfinding } from '../core/components';

export class WorkerSystem extends System {
  readonly id = 'worker';
  readonly requiredComponents = ['worker', 'transform'];

  private resourceNodes: Map<number, any> = new Map(); // EntityId -> Entity
  private buildings: Map<number, any> = new Map(); // EntityId -> Entity
  private teams: Map<string, any> = new Map(); // faction -> Team component

  registerResourceNode(entityId: number, entity: any): void {
    this.resourceNodes.set(entityId, entity);
  }

  registerBuilding(entityId: number, entity: any): void {
    this.buildings.set(entityId, entity);
  }

  registerTeam(faction: string, teamComponent: Team): void {
    this.teams.set(faction, teamComponent);
  }

  update(deltaTime: number): void {
    this.entities.forEach((entity) => {
      const worker = entity.getComponent<Worker>('worker');
      const transform = entity.getComponent<Transform>('transform');

      if (!worker || !transform) return;

      switch (worker.state) {
        case 'gathering':
          this.updateGathering(entity, worker, transform, deltaTime);
          break;
        case 'building':
          this.updateBuilding(entity, worker, transform, deltaTime);
          break;
        case 'walking':
          this.updateWalking(entity, worker, transform);
          break;
        case 'idle':
          // Idle state, no action
          break;
      }
    });
  }

  private updateGathering(entity: any, worker: Worker, transform: Transform, deltaTime: number): void {
    if (worker.targetResourceId === null) {
      worker.state = 'idle';
      return;
    }

    const resourceEntity = this.resourceNodes.get(worker.targetResourceId);
    if (!resourceEntity) {
      worker.state = 'idle';
      return;
    }

    const resourceNode = resourceEntity.getComponent<ResourceNode>('resourceNode');
    const resourceTransform = resourceEntity.getComponent<Transform>('transform');

    if (!resourceNode || !resourceTransform) {
      worker.state = 'idle';
      return;
    }

    // Check distance to resource
    const dx = resourceTransform.x - transform.x;
    const dy = resourceTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 32) {
      // Too far, need to walk to resource
      worker.state = 'walking';
      return;
    }

    // Gather resource
    if (worker.canCarry(worker.gatherSpeed * deltaTime)) {
      const harvested = resourceNode.harvest(worker.gatherSpeed * deltaTime);
      worker.currentCarry += harvested;
      worker.resourceType = resourceNode.resourceType;

      if (resourceNode.isDepleted()) {
        worker.targetResourceId = null;
        worker.state = 'idle';
      }
    } else {
      // Inventory full, need to return to base
      worker.state = 'walking';
    }
  }

  private updateBuilding(entity: any, worker: Worker, transform: Transform, deltaTime: number): void {
    if (worker.targetBuildingId === null) {
      worker.state = 'idle';
      return;
    }

    const buildingEntity = this.buildings.get(worker.targetBuildingId);
    if (!buildingEntity) {
      worker.state = 'idle';
      return;
    }

    const building = buildingEntity.getComponent<Building>('building');
    const buildTransform = buildingEntity.getComponent<Transform>('transform');

    if (!building || !buildTransform || building.isComplete) {
      worker.state = 'idle';
      return;
    }

    // Check distance to building
    const dx = buildTransform.x - transform.x;
    const dy = buildTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 32) {
      // Too far, need to walk to building
      worker.state = 'walking';
      return;
    }

    // Build
    building.progress(deltaTime, worker.buildSpeed);
  }

  private updateWalking(entity: any, worker: Worker, transform: Transform): void {
    // Walking is handled by the movement system via pathfinding
    // Check if we've reached the target and switch states
    if (worker.targetResourceId !== null) {
      const resourceEntity = this.resourceNodes.get(worker.targetResourceId);
      if (resourceEntity) {
        const resourceTransform = resourceEntity.getComponent<Transform>('resourceNode');
        if (resourceTransform) {
          const dx = resourceTransform.x - transform.x;
          const dy = resourceTransform.y - transform.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 32) {
            worker.state = 'gathering';
          }
        }
      }
    }

    if (worker.targetBuildingId !== null) {
      const buildingEntity = this.buildings.get(worker.targetBuildingId);
      if (buildingEntity) {
        const buildTransform = buildingEntity.getComponent<Transform>('transform');
        if (buildTransform) {
          const dx = buildTransform.x - transform.x;
          const dy = buildTransform.y - transform.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 32) {
            worker.state = 'building';
          }
        }
      }
    }
  }

  commandWorkerToGather(entity: any, resourceId: number): void {
    const worker = entity.getComponent<Worker>('worker');
    if (worker) {
      worker.state = 'walking';
      worker.targetResourceId = resourceId;
      worker.targetBuildingId = null;
    }
  }

  commandWorkerToBuild(entity: any, buildingId: number): void {
    const worker = entity.getComponent<Worker>('worker');
    if (worker) {
      worker.state = 'walking';
      worker.targetBuildingId = buildingId;
      worker.targetResourceId = null;
    }
  }
}
