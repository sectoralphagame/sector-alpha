class CyclicBuffer {
  private buffer: Float32Array;
  private index: number;
  private size: number;
  private filled: boolean = false;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Float32Array(size);
    this.index = 1;
  }

  add(value: number): void {
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.size;

    if (this.index === 0) {
      this.filled = true;
    }
  }

  avg(): number {
    let sum = 0;

    for (let i = 0; i < this.size; i++) {
      sum += this.buffer[i];
    }
    return sum / this.size;
  }

  ready(): boolean {
    return this.filled;
  }

  reset(): void {
    this.buffer.fill(0);
    this.index = 0;
  }
}

export class RenderingPerformance {
  frameTime: CyclicBuffer;
  timeToNextFrame: CyclicBuffer;
  lastFrameStartTime: number = 0;

  constructor() {
    this.frameTime = new CyclicBuffer(120);
    this.timeToNextFrame = new CyclicBuffer(120);
  }

  updateFrameTime(time: number): void {
    this.frameTime.add(time);
  }
  updateTimeToNextFrame(): void {
    const now = performance.now();
    this.timeToNextFrame.add(now - this.lastFrameStartTime);
    this.lastFrameStartTime = now;
  }

  get fps(): number {
    if (!this.frameTime.ready()) {
      return 0;
    }

    return Math.floor(Math.min(1000 / this.timeToNextFrame.avg(), 240));
  }

  get averageFrameTime(): number {
    if (!this.frameTime.ready()) {
      return 0;
    }

    return this.frameTime.avg();
  }
}
