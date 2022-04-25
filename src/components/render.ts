export class Render {
  color: string | null;
  size: number;
  minScale: number;

  constructor(size: number, minScale: number, color?: string) {
    this.size = size;
    this.minScale = minScale;

    if (color) {
      this.color = color;
    }
  }
}
