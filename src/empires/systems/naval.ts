import { System, Entity } from '../core/ecs';
import { Transform, Velocity, Unit, Health } from '../core/components';
import { Naval, Projectile } from '../core/components-advanced';

/**
 * Naval System - Manages transport ships, naval combat, and unit ferrying
 * Transport units allow land units to traverse water and islands
 */
export class NavalSystem extends System {
  readonly id = 'naval';
  readonly requiredComponents = ['naval', 'transform'];

  private loadingDistance: number = 32; // How close units need to be to load
  private maxNavalCombatRange: number = 200; // Naval combat range

  update(deltaTime: number): void {
    this.entities.forEach((entity) => {
      const naval = entity.getComponent<Naval>('naval');
      const transform = entity.getComponent<Transform>('transform');
      const velocity = entity.getComponent<Velocity>('velocity');

      if (!naval || !transform) return;

      // Movement for naval units
      if (velocity) {
        // Naval units move faster over water
        velocity.vx *= 1.1;
        velocity.vy *= 1.1;
      }

      // Handle unit loading/unloading
      this.manageCargoLoading(entity, naval, transform);

      // Naval combat
      if (naval.type === 'warship') {
        this.performNavalCombat(entity, naval, transform);
      }
    });
  }

  private manageCargoLoading(entity: Entity, naval: Naval, transform: Transform): void {
    // Find units nearby that want to load
    this.entities.forEach((potentialCargo) => {
      // Only land units can be loaded
      if (potentialCargo.hasComponent('naval')) return;
      if (!potentialCargo.hasComponent('unit')) return;

      const cargoTransform = potentialCargo.getComponent<Transform>('transform');
      if (!cargoTransform) return;

      // Check distance
      const dx = cargoTransform.x - transform.x;
      const dy = cargoTransform.y - transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.loadingDistance && naval.canLoadUnit()) {
        // Auto-load nearby units (in real game, player would command this)
        naval.loadUnit(potentialCargo.id);

        // Hide the unit visually (it's on the ship)
        const cargoSprite = potentialCargo.getComponent('sprite');
        if (cargoSprite) {
          (cargoSprite as any).hidden = true;
        }
      }
    });

    // Unload cargo when near dock or shore
    // TODO: Implement dock detection
  }

  private performNavalCombat(entity: Entity, naval: Naval, transform: Transform): void {
    const unit = entity.getComponent<Unit>('unit');
    const health = entity.getComponent<Health>('health');

    if (!unit || !health || naval.type !== 'warship') return;

    // Find enemy naval units within range
    this.entities.forEach((targetEntity) => {
      const targetNaval = targetEntity.getComponent<Naval>('naval');
      const targetTransform = targetEntity.getComponent<Transform>('transform');
      const targetUnit = targetEntity.getComponent<Unit>('unit');

      if (!targetNaval || !targetTransform || !targetUnit) return;
      if (targetUnit.faction === unit.faction) return; // Don't attack allies

      const dx = targetTransform.x - transform.x;
      const dy = targetTransform.y - transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.maxNavalCombatRange) {
        // Fire naval artillery
        this.fireNavalProjectile(entity, targetEntity, unit, distance);
      }
    });
  }

  private fireNavalProjectile(attacker: Entity, target: Entity, unit: Unit, distance: number): void {
    const attackTransform = attacker.getComponent<Transform>('transform');
    const targetTransform = target.getComponent<Transform>('transform');

    if (!attackTransform || !targetTransform) return;

    // Calculate firing angle (higher arc for naval combat)
    const dx = targetTransform.x - attackTransform.x;
    const dy = targetTransform.y - attackTransform.y;

    // Naval projectiles are cannonballs - heavier, more arc
    const gravity = 15; // Stronger gravity pulls projectile down faster
    const fireSpeed = 150;
    const angle = Math.PI / 3; // 60 degrees

    const velocityX = Math.cos(angle) * fireSpeed * (dx / distance);
    const velocityY = Math.sin(angle) * fireSpeed - gravity;

    // Create projectile (handled by combat system)
    // TODO: Integrate with CombatSystem
  }

  /**
   * Commands a transport ship to pick up units
   */
  commandLoadUnits(shipEntity: Entity): void {
    const naval = shipEntity.getComponent<Naval>('naval');
    if (!naval || naval.type !== 'transport') return;

    // Units near the ship will automatically board
    // (implementation in manageCargoLoading)
  }

  /**
   * Commands a transport ship to unload at destination
   */
  commandUnloadUnits(shipEntity: Entity, destX: number, destY: number): void {
    const naval = shipEntity.getComponent<Naval>('naval');
    if (!naval || naval.type !== 'transport') return;

    // Drop off units at destination
    const cargoIds = [...naval.cargo];
    cargoIds.forEach((unitId) => {
      naval.unloadUnit(unitId);
      // Show the unit again
      // TODO: Make unit appear near destination
    });
  }

  /**
   * Get status of all transport ships
   */
  getFleetStatus(): Array<{
    shipId: number;
    type: string;
    cargo: number;
    capacity: number;
  }> {
    const status: Array<{
      shipId: number;
      type: string;
      cargo: number;
      capacity: number;
    }> = [];

    this.entities.forEach((entity) => {
      const naval = entity.getComponent<Naval>('naval');
      if (naval && naval.type !== 'warship') {
        status.push({
          shipId: entity.id,
          type: naval.type,
          cargo: naval.cargo.length,
          capacity: naval.capacity,
        });
      }
    });

    return status;
  }
}
