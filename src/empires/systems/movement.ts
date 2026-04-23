import { System } from '../core/ecs';
import { Transform, Velocity, Unit, Pathfinding } from '../core/components';

export class MovementSystem extends System {
  readonly id = 'movement';
  readonly requiredComponents = ['transform', 'velocity'];

  private friction: number = 0.95;
  private stoppingDistance: number = 5;

  update(deltaTime: number): void {
    this.entities.forEach((entity) => {
      const transform = entity.getComponent<Transform>('transform');
      const velocity = entity.getComponent<Velocity>('velocity');
      const pathfinding = entity.getComponent<Pathfinding>('pathfinding');
      const unit = entity.getComponent<Unit>('unit');

      if (!transform || !velocity) return;

      // Handle pathfinding-based movement
      if (pathfinding && pathfinding.hasPath()) {
        const waypoint = pathfinding.getNextWaypoint();
        if (waypoint) {
          const dx = waypoint.x - transform.x;
          const dy = waypoint.y - transform.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < this.stoppingDistance) {
            pathfinding.advanceWaypoint();
          } else {
            const speed = unit ? unit.speed : 100;
            const moveSpeed = (speed * deltaTime) / distance;
            velocity.vx = dx * moveSpeed;
            velocity.vy = dy * moveSpeed;
          }
        }
      }

      // Apply velocity to position
      transform.x += velocity.vx * deltaTime;
      transform.y += velocity.vy * deltaTime;

      // Apply friction
      velocity.vx *= this.friction;
      velocity.vy *= this.friction;

      // Update rotation based on velocity direction
      if (Math.abs(velocity.vx) > 0.1 || Math.abs(velocity.vy) > 0.1) {
        transform.rotation = Math.atan2(velocity.vy, velocity.vx);
      }
    });
  }
}

export class CollisionSystem extends System {
  readonly id = 'collision';
  readonly requiredComponents = ['transform'];

  private mapWidth: number = 2000;
  private mapHeight: number = 2000;

  update(): void {
    // Simple boundary checking
    this.entities.forEach((entity) => {
      const transform = entity.getComponent<Transform>('transform');
      if (!transform) return;

      if (transform.x < 0) transform.x = 0;
      if (transform.y < 0) transform.y = 0;
      if (transform.x > this.mapWidth) transform.x = this.mapWidth;
      if (transform.y > this.mapHeight) transform.y = this.mapHeight;
    });

    // TODO: Implement quadtree-based collision detection for units
  }

  setMapBounds(width: number, height: number): void {
    this.mapWidth = width;
    this.mapHeight = height;
  }
}
