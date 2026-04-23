import { System } from '../core/ecs';
import { Transform, Health, Unit } from '../core/components';
import { Morale } from '../core/components-advanced';

/**
 * Morale System - Manages unit morale and its effects on performance
 * Morale is affected by:
 * - Nearby friendly units (strength in numbers)
 * - Nearby hero units (leader presence)
 * - Casualty rates (losses reduce morale)
 * - Victories (defeating enemies boosts morale)
 */
export class MoraleSystem extends System {
  readonly id = 'morale';
  readonly requiredComponents = ['morale', 'unit'];

  private auraRadius: number = 100; // Morale influence radius
  private unitDeaths: Map<string, number> = new Map(); // faction -> death count
  private lastMoraleCheck: Map<string, number> = new Map();

  update(deltaTime: number): void {
    // Update morale for each unit
    this.entities.forEach((entity) => {
      const morale = entity.getComponent<Morale>('morale');
      const transform = entity.getComponent<Transform>('transform');
      const unit = entity.getComponent<Unit>('unit');

      if (!morale || !transform || !unit) return;

      // Count nearby friendly units for morale boost
      morale.unitsNearby = 0;
      this.entities.forEach((other) => {
        if (other.id === entity.id) return;

        const otherTransform = other.getComponent<Transform>('transform');
        const otherUnit = other.getComponent<Unit>('unit');

        if (!otherTransform || !otherUnit) return;
        if (otherUnit.faction !== unit.faction) return; // Only friendly units matter

        const dx = otherTransform.x - transform.x;
        const dy = otherTransform.y - transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.auraRadius) {
          morale.unitsNearby++;
        }
      });

      // Apply morale effects to unit stats
      this.applyMoraleEffects(entity, morale, unit);

      // Update morale state
      morale.update(deltaTime);

      // Gradual recovery when not in combat
      if (morale.current < morale.max && morale.unitsNearby > 0) {
        morale.current = Math.min(morale.max, morale.current + 5 * deltaTime);
      }
    });
  }

  private applyMoraleEffects(entity: any, morale: Morale, unit: Unit): void {
    // Apply multipliers to unit stats based on morale state
    unit.attackDamage *= morale.damageMultiplier;
    unit.speed *= morale.speedMultiplier;

    // Morale affects entity physics and behavior
    const health = entity.getComponent<Health>('health');
    if (health) {
      // Armor is affected by morale (confidence vs carelessness)
      health.armor *= morale.armorMultiplier;
    }
  }

  recordUnitDeath(faction: string): void {
    const currentCount = this.unitDeaths.get(faction) || 0;
    this.unitDeaths.set(faction, currentCount + 1);

    // Reduce morale for all units of that faction
    this.entities.forEach((entity) => {
      const morale = entity.getComponent<Morale>('morale');
      const unit = entity.getComponent<Unit>('unit');

      if (morale && unit && unit.faction === faction) {
        morale.takeCasualty();
      }
    });
  }

  recordVictory(faction: string, enemyCount: number): void {
    // Boost morale for all units of that faction
    this.entities.forEach((entity) => {
      const morale = entity.getComponent<Morale>('morale');
      const unit = entity.getComponent<Unit>('unit');

      if (morale && unit && unit.faction === faction) {
        morale.witnessVictory(enemyCount);
      }
    });
  }

  applyHeroAura(heroPower: number = 1): void {
    // Hero units provide morale boost to nearby units
    this.entities.forEach((heroEntity) => {
      const heroTransform = heroEntity.getComponent<Transform>('transform');
      const heroUnit = heroEntity.getComponent<Unit>('unit');

      if (!heroTransform || !heroUnit) return;
      if (heroUnit.type !== 'hero') return; // Only heroes have auras

      // Apply boost to nearby units
      this.entities.forEach((entity) => {
        const morale = entity.getComponent<Morale>('morale');
        const transform = entity.getComponent<Transform>('transform');
        const unit = entity.getComponent<Unit>('unit');

        if (!morale || !transform || !unit) return;
        if (unit.faction !== heroUnit.faction) return;

        const dx = transform.x - heroTransform.x;
        const dy = transform.y - heroTransform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.auraRadius * 2) {
          morale.boostFromHero();
        }
      });
    });
  }

  getMoraleReport(faction: string): {
    averageMorale: number;
    unitCount: number;
    fearfulCount: number;
    fervorCount: number;
    casualtyRate: number;
  } {
    const factionUnits: Morale[] = [];

    this.entities.forEach((entity) => {
      const morale = entity.getComponent<Morale>('morale');
      const unit = entity.getComponent<Unit>('unit');

      if (morale && unit && unit.faction === faction) {
        factionUnits.push(morale);
      }
    });

    const fearfulCount = factionUnits.filter((m) => m.state === 'fearful').length;
    const fervorCount = factionUnits.filter((m) => m.state === 'fervor').length;
    const averageMorale = factionUnits.length > 0 ? factionUnits.reduce((sum, m) => sum + m.current, 0) / factionUnits.length : 100;

    return {
      averageMorale,
      unitCount: factionUnits.length,
      fearfulCount,
      fervorCount,
      casualtyRate: (this.unitDeaths.get(faction) || 0) / Math.max(1, factionUnits.length),
    };
  }
}
