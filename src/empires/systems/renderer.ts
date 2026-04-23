import { System, Entity, EntityId } from '../core/ecs';
import { Transform, Sprite } from '../core/components';

export class RendererSystem extends System {
  readonly id = 'renderer';
  readonly requiredComponents = ['transform', 'sprite'];

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textures: Map<string, CanvasImageSource> = new Map();
  private cameraX: number = 0;
  private cameraY: number = 0;
  private zoom: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  loadTexture(name: string, source: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.textures.set(name, img);
        resolve();
      };
      img.src = source;
    });
  }

  setCamera(x: number, y: number, zoom: number = 1): void {
    this.cameraX = x;
    this.cameraY = y;
    this.zoom = Math.max(0.5, Math.min(3, zoom)); // Clamp zoom 0.5 - 3
  }

  update(): void {
    this.clearScreen();
    this.entities.forEach((entity) => this.renderEntity(entity));
  }

  private clearScreen(): void {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderEntity(entity: Entity): void {
    const transform = entity.getComponent<Transform>('transform');
    const sprite = entity.getComponent<Sprite>('sprite');

    if (!transform || !sprite) return;

    const screenX = (transform.x - this.cameraX) * this.zoom + this.canvas.width / 2;
    const screenY = (transform.y - this.cameraY) * this.zoom + this.canvas.height / 2;

    const texture = this.textures.get(sprite.textureName);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.rotate(transform.rotation);
    this.ctx.scale(sprite.width * this.zoom / 32, sprite.height * this.zoom / 32);

    if (texture) {
      this.ctx.drawImage(texture, -16, -16, 32, 32);
    } else {
      this.ctx.fillStyle = '#888';
      this.ctx.fillRect(-16, -16, 32, 32);
    }

    this.ctx.restore();
  }

  renderDebugGrid(cellSize: number = 32): void {
    const startX = Math.floor(this.cameraX / cellSize) * cellSize;
    const startY = Math.floor(this.cameraY / cellSize) * cellSize;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;

    for (let x = startX; x < this.cameraX + this.canvas.width / this.zoom; x += cellSize) {
      const screenX = (x - this.cameraX) * this.zoom + this.canvas.width / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = startY; y < this.cameraY + this.canvas.height / this.zoom; y += cellSize) {
      const screenY = (y - this.cameraY) * this.zoom + this.canvas.height / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.canvas.width, screenY);
      this.ctx.stroke();
    }
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvas.width, height: this.canvas.height };
  }
}
