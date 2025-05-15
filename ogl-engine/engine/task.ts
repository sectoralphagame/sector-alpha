export const taskPriority = {
  high: 0,
  medium: 1,
  low: 2,
};
Object.freeze(taskPriority);

let taskId = 0;
export class OnBeforeRenderTask {
  private task: () => void;
  private isRunning: boolean = true;
  readonly id: number;
  readonly priority: number = 0;

  constructor(task: () => void, priority = taskPriority.medium) {
    this.task = task;
    this.id = taskId++;
    this.priority = priority;
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
