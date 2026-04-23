/**
 * A* Pathfinding - Mobile-optimized for real-time RTS movement
 * Uses grid-based search with heuristic optimization
 */

interface GridNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // g + h
  parent: GridNode | null;
  isWalkable: boolean;
}

export class Pathfinder {
  private gridSize: number = 16; // 16x16 pixel cells
  private mapWidth: number;
  private mapHeight: number;
  private walkableGrid: boolean[][] = [];
  private maxIterations: number = 1000; // Prevent infinite loops on mobile

  constructor(mapWidth: number, mapHeight: number) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.initializeGrid();
  }

  private initializeGrid(): void {
    const gridWidth = Math.ceil(this.mapWidth / this.gridSize);
    const gridHeight = Math.ceil(this.mapHeight / this.gridSize);

    this.walkableGrid = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill(true));
  }

  setObstacle(x: number, y: number, width: number, height: number): void {
    const startGridX = Math.floor(x / this.gridSize);
    const startGridY = Math.floor(y / this.gridSize);
    const endGridX = Math.ceil((x + width) / this.gridSize);
    const endGridY = Math.ceil((y + height) / this.gridSize);

    for (let gy = startGridY; gy < endGridY; gy++) {
      for (let gx = startGridX; gx < endGridX; gx++) {
        if (gy >= 0 && gy < this.walkableGrid.length && gx >= 0 && gx < this.walkableGrid[0].length) {
          this.walkableGrid[gy][gx] = false;
        }
      }
    }
  }

  findPath(startX: number, startY: number, goalX: number, goalY: number): Array<{ x: number; y: number }> {
    const startGrid = this.pixelToGrid(startX, startY);
    const goalGrid = this.pixelToGrid(goalX, goalY);

    const openSet: GridNode[] = [];
    const closedSet: Set<string> = new Set();

    const startNode: GridNode = {
      x: startGrid.x,
      y: startGrid.y,
      g: 0,
      h: this.heuristic(startGrid.x, startGrid.y, goalGrid.x, goalGrid.y),
      f: 0,
      parent: null,
      isWalkable: true,
    };
    startNode.f = startNode.g + startNode.h;

    openSet.push(startNode);

    let iterations = 0;
    while (openSet.length > 0 && iterations < this.maxIterations) {
      iterations++;

      // Find node with lowest f score
      let current = openSet[0];
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < current.f) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      if (current.x === goalGrid.x && current.y === goalGrid.y) {
        return this.reconstructPath(current);
      }

      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);

      const neighbors = this.getNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(key) || !neighbor.isWalkable) continue;

        const tentativeG = current.g + this.distance(current.x, current.y, neighbor.x, neighbor.y);

        let openNode = openSet.find((n) => n.x === neighbor.x && n.y === neighbor.y);
        if (!openNode) {
          openNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor.x, neighbor.y, goalGrid.x, goalGrid.y),
            f: 0,
            parent: current,
            isWalkable: true,
          };
          openNode.f = openNode.g + openNode.h;
          openSet.push(openNode);
        } else if (tentativeG < openNode.g) {
          openNode.g = tentativeG;
          openNode.f = openNode.g + openNode.h;
          openNode.parent = current;
        }
      }
    }

    // No path found, return empty array
    return [];
  }

  private pixelToGrid(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.floor(x / this.gridSize),
      y: Math.floor(y / this.gridSize),
    };
  }

  private gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: gridX * this.gridSize + this.gridSize / 2,
      y: gridY * this.gridSize + this.gridSize / 2,
    };
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Manhattan distance heuristic
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    // Diagonal distance with cost of 1.4 for diagonals
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getNeighbors(x: number, y: number): GridNode[] {
    const neighbors: GridNode[] = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (ny >= 0 && ny < this.walkableGrid.length && nx >= 0 && nx < this.walkableGrid[0].length) {
        neighbors.push({
          x: nx,
          y: ny,
          g: 0,
          h: 0,
          f: 0,
          parent: null,
          isWalkable: this.walkableGrid[ny][nx],
        });
      }
    }

    return neighbors;
  }

  private reconstructPath(node: GridNode): Array<{ x: number; y: number }> {
    const path: Array<{ x: number; y: number }> = [];
    let current: GridNode | null = node;

    while (current) {
      const pixel = this.gridToPixel(current.x, current.y);
      path.unshift(pixel);
      current = current.parent;
    }

    return path;
  }
}
