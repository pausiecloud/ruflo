import { Component } from './ecs';

export class Transform implements Component {
  id = 'transform';
  x: number = 0;
  y: number = 0;
  rotation: number = 0;
  scale: number = 1;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

export class Velocity implements Component {
  id = 'velocity';
  vx: number = 0;
  vy: number = 0;

  constructor(vx: number = 0, vy: number = 0) {
    this.vx = vx;
    this.vy = vy;
  }
}

export class Sprite implements Component {
  id = 'sprite';
  textureName: string;
  width: number;
  height: number;
  frameIndex: number = 0;
  isAnimated: boolean = false;

  constructor(textureName: string, width: number, height: number) {
    this.textureName = textureName;
    this.width = width;
    this.height = height;
  }
}

export class Health implements Component {
  id = 'health';
  current: number;
  max: number;
  armor: number = 0;

  constructor(max: number, armor: number = 0) {
    this.max = max;
    this.current = max;
    this.armor = armor;
  }

  takeDamage(damage: number): void {
    const mitigated = Math.max(0, damage - this.armor);
    this.current = Math.max(0, this.current - mitigated);
  }

  isAlive(): boolean {
    return this.current > 0;
  }
}

export class Unit implements Component {
  id = 'unit';
  type: string;
  faction: string;
  speed: number;
  attackRange: number;
  attackDamage: number;
  attackCooldown: number = 0;

  constructor(
    type: string,
    faction: string,
    speed: number,
    attackRange: number,
    attackDamage: number
  ) {
    this.type = type;
    this.faction = faction;
    this.speed = speed;
    this.attackRange = attackRange;
    this.attackDamage = attackDamage;
  }
}

export class Worker implements Component {
  id = 'worker';
  carryCapacity: number = 100;
  currentCarry: number = 0;
  resourceType: string | null = null;
  gatherSpeed: number = 20; // units per second
  buildSpeed: number = 15; // build points per second
  state: 'idle' | 'gathering' | 'building' | 'walking' = 'idle';
  targetResourceId: number | null = null;
  targetBuildingId: number | null = null;

  constructor() {}

  canCarry(amount: number): boolean {
    return this.currentCarry + amount <= this.carryCapacity;
  }

  deposit(): number {
    const amount = this.currentCarry;
    this.currentCarry = 0;
    this.resourceType = null;
    return amount;
  }
}

export class Building implements Component {
  id = 'building';
  type: string;
  faction: string;
  buildProgress: number = 0;
  buildTimeSeconds: number;
  isComplete: boolean = false;

  constructor(type: string, faction: string, buildTimeSeconds: number) {
    this.type = type;
    this.faction = faction;
    this.buildTimeSeconds = buildTimeSeconds;
  }

  progress(deltaTime: number, buildSpeed: number): void {
    this.buildProgress += deltaTime * buildSpeed;
    if (this.buildProgress >= this.buildTimeSeconds) {
      this.isComplete = true;
      this.buildProgress = this.buildTimeSeconds;
    }
  }
}

export class ResourceNode implements Component {
  id = 'resourceNode';
  resourceType: 'food' | 'wood' | 'gold' | 'ore';
  amount: number;
  maxAmount: number;
  depletionRate: number = 0.1;

  constructor(type: 'food' | 'wood' | 'gold' | 'ore', amount: number) {
    this.resourceType = type;
    this.amount = amount;
    this.maxAmount = amount;
  }

  harvest(amount: number): number {
    const harvested = Math.min(amount, this.amount);
    this.amount -= harvested;
    return harvested;
  }

  isDepleted(): boolean {
    return this.amount <= 0;
  }
}

export class Team implements Component {
  id = 'team';
  gold: number = 0;
  food: number = 0;
  wood: number = 0;
  ore: number = 0;
  morale: number = 100; // 0-100, affects unit performance

  constructor() {}

  addResource(type: string, amount: number): void {
    const key = type.toLowerCase() as keyof Omit<Team, 'id' | 'morale'>;
    if (key in this && typeof this[key] === 'number') {
      (this[key] as number) += amount;
    }
  }

  spendResource(type: string, amount: number): boolean {
    const key = type.toLowerCase() as keyof Omit<Team, 'id' | 'morale'>;
    if (key in this && typeof this[key] === 'number') {
      if ((this[key] as number) >= amount) {
        (this[key] as number) -= amount;
        return true;
      }
    }
    return false;
  }
}

export class Pathfinding implements Component {
  id = 'pathfinding';
  path: Array<{ x: number; y: number }> = [];
  currentWaypointIndex: number = 0;
  isPathing: boolean = false;
  targetX: number = 0;
  targetY: number = 0;

  constructor() {}

  setPath(path: Array<{ x: number; y: number }>): void {
    this.path = path;
    this.currentWaypointIndex = 0;
    this.isPathing = path.length > 0;
  }

  hasPath(): boolean {
    return this.path.length > 0 && this.isPathing;
  }

  getNextWaypoint(): { x: number; y: number } | null {
    if (this.currentWaypointIndex < this.path.length) {
      return this.path[this.currentWaypointIndex];
    }
    return null;
  }

  advanceWaypoint(): void {
    this.currentWaypointIndex++;
    if (this.currentWaypointIndex >= this.path.length) {
      this.isPathing = false;
    }
  }
}
