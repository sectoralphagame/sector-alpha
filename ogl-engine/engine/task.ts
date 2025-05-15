let taskId = 0;
export class OnBeforeRenderTask {
  private task: () => void;
  private isRunning: boolean = true;
  readonly id: number;

  constructor(task: () => void) {
    this.task = task;
    this.id = taskId++;
  }

  public isValid() {
    return this.isRunning;
  }

  public run(): void {
    this.task();
  }

  public cancel(): void {
    this.isRunning = false;
  }
}
