import { System, Entity, EntityId } from '../core/ecs';
import { Transform, Velocity, Health, Unit } from '../core/components';
import { Projectile } from '../core/components-advanced';

/**
 * Combat System - Manages projectile lifecycle, impacts, and damage
 */
export class CombatSystem extends System {
  readonly id = 'combat';
  readonly requiredComponents = ['projectile', 'transform', 'velocity'];

  private projectileEntities: Map<EntityId, Entity> = new Map();
  private targetableEntities: Entity[] = []; // Units that can be hit
  private hitLog: Array<{ projectileId: EntityId; targetId: EntityId; damage: number }> = [];

  registerTargetableEntity(entity: Entity): void {
    if (entity.hasComponent('health') && entity.hasComponent('unit')) {
      this.targetableEntities.push(entity);
    }
  }

  unregisterTargetableEntity(entityId: EntityId): void {
    this.targetableEntities = this.targetableEntities.filter((e) => e.id !== entityId);
  }

  createProjectile(
    firedFrom: Entity,
    targetEntity: Entity | null,
    damage: number,
    splashRadius: number = 0
  ): Entity {
    const fireTransform = firedFrom.getComponent<Transform>('transform');
    const unit = firedFrom.getComponent<Unit>('unit');

    if (!fireTransform || !unit) return null as any;

    // Calculate launch velocity towards target
    let targetX: number, targetY: number;

    if (targetEntity) {
      const targetTransform = targetEntity.getComponent<Transform>('transform');
      if (targetTransform) {
        targetX = targetTransform.x;
        targetY = targetTransform.y;
      } else {
        return null as any;
      }
    } else {
      // Default direction based on unit rotation
      targetX = fireTransform.x + Math.cos(fireTransform.rotation) * 500;
      targetY = fireTransform.y + Math.sin(fireTransform.rotation) * 500;
    }

    // Calculate ballistic trajectory
    const dx = targetX - fireTransform.x;
    const dy = targetY - fireTransform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Simulate launch with slight arc
    const gravity = 9.8;
    const launchSpeed = Math.sqrt((gravity * distance) / 2) * 1.5; // 1.5x for higher arc
    const launchAngle = Math.PI / 4; // 45 degrees

    const velocityX = Math.cos(launchAngle) * launchSpeed * (dx / distance);
    const velocityY = Math.sin(launchAngle) * launchSpeed * (dy / distance) - gravity;

    return {
      addComponent: (component: any) => {
        component;
        return { id: 0 };
      },
      getComponent: () => null,
      hasComponent: () => false,
      removeComponent: () => {},
      getAllComponents: () => [],
      id: 0,
    } as any; // TODO: Return actual projectile entity
  }

  update(deltaTime: number): void {
    const projectilesToRemove: EntityId[] = [];

    this.entities.forEach((entity) => {
      const projectile = entity.getComponent<Projectile>('projectile');
      const transform = entity.getComponent<Transform>('transform');
      const velocity = entity.getComponent<Velocity>('velocity');

      if (!projectile || !transform || !velocity) return;

      // Update projectile physics
      projectile.update(deltaTime);

      // Apply velocity from projectile calculations
      const trajectory = projectile.getTrajectory(deltaTime);
      velocity.vx = trajectory.x / deltaTime;
      velocity.vy = trajectory.y / deltaTime;

      // Check for impacts
      if (projectile.impact || projectile.hasHit) {
        this.handleProjectileImpact(entity, projectile, transform);
        projectilesToRemove.push(entity.id);
      } else {
        // Check for collision with targets
        this.checkProjectileCollisions(entity, projectile, transform);
      }
    });

    // Remove expired projectiles
    projectilesToRemove.forEach((id) => this.removeEntity(id));
  }

  private checkProjectileCollisions(entity: Entity, projectile: Projectile, transform: Transform): void {
    for (const targetEntity of this.targetableEntities) {
      const targetTransform = targetEntity.getComponent<Transform>('transform');
      if (!targetTransform) continue;

      const dx = targetTransform.x - transform.x;
      const dy = targetTransform.y - transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if projectile hit (collision radius)
      if (distance < projectile.radius + 16) {
        // 16 = typical unit radius
        this.handleProjectileHit(projectile, targetEntity, distance);
        projectile.hasHit = true;
        projectile.impact = true;
        break;
      }
    }
  }

  private handleProjectileHit(projectile: Projectile, targetEntity: Entity, distance: number): void {
    const health = targetEntity.getComponent<Health>('health');
    if (!health) return;

    const damage = projectile.getImpactDamage();
    health.takeDamage(damage);

    this.hitLog.push({
      projectileId: 0, // TODO: actual projectile ID
      targetId: targetEntity.id,
      damage,
    });

    // Splash damage
    if (projectile.splashRadius > 0) {
      this.applyAoeDamage(projectile, distance);
    }
  }

  private handleProjectileImpact(entity: Entity, projectile: Projectile, transform: Transform): void {
    // Impact effects at ground zero
    if (projectile.splashRadius > 0) {
      this.applyAoeDamage(projectile, 0);
    }

    // TODO: Create explosion particle effect
    // TODO: Create impact crater/scorch mark
  }

  private applyAoeDamage(projectile: Projectile, epicenterDistance: number): void {
    const baseDamage = projectile.getImpactDamage();

    for (const targetEntity of this.targetableEntities) {
      const targetHealth = targetEntity.getComponent<Health>('health');
      if (!targetHealth) continue;

      // Calculate distance-based falloff
      const damageReduction = Math.max(0, 1 - epicenterDistance / projectile.splashRadius);
      const aoeDamage = baseDamage * damageReduction * 0.75; // 75% of impact damage

      if (aoeDamage > 0) {
        targetHealth.takeDamage(aoeDamage);
      }
    }
  }

  getHitLog(): Array<{ projectileId: EntityId; targetId: EntityId; damage: number }> {
    const log = [...this.hitLog];
    this.hitLog = [];
    return log;
  }
}
