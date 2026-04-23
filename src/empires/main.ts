/**
 * Empires RTS - Main Entry Point
 * Mobile-first Real-Time Strategy game
 */

import { GameManager } from './game/manager';

let gameManager: GameManager | null = null;

function initializeGame(): void {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  gameManager = new GameManager(canvas);

  // Create initial test entities
  setupTestScene();

  // Start game loop
  gameManager.start();
}

function setupTestScene(): void {
  if (!gameManager) return;

  // Create a test faction (Solar Kingdom)
  const faction = 'solar_kingdom';

  // Create some workers
  for (let i = 0; i < 3; i++) {
    gameManager.createWorker(faction, 100 + i * 50, 100);
  }

  // Create resource nodes
  gameManager.createResourceNode('wood', 400, 200, 500);
  gameManager.createResourceNode('food', 300, 150, 400);
  gameManager.createResourceNode('gold', 600, 400, 200);
  gameManager.createResourceNode('ore', 650, 450, 300);

  // Create a building
  gameManager.createBuilding('town_center', faction, 150, 250, 60);

  // Set initial camera position
  gameManager.setCameraPosition(1000, 1000, 1);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}

// Export for external use
declare global {
  interface Window {
    gameManager: GameManager | null;
  }
}

window.gameManager = gameManager;
