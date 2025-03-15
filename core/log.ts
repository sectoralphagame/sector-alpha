type Severity = "debug" | "info" | "warn" | "error";
const levels: Record<Severity, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
const colors: Record<Severity, string> = {
  debug: "#aaaaaa",
  info: "#00ff00",
  warn: "#ffff00",
  error: "#ff0000",
};

export class SubLogger {
  private parent: Logger | SubLogger;
  private prefix: string;

  constructor(parent: Logger | SubLogger, prefix: string) {
    this.parent = parent;
    this.prefix = prefix;
  }

  log(
    message: string,
    severity: Severity = "info",
    prefix: string[] = []
  ): void {
    this.parent.log(message, severity, [this.prefix, ...prefix]);
  }

  sub(prefix: string): SubLogger {
    const logger = new SubLogger(this, prefix);
    return logger;
  }
}

class Logger {
  logs: string[] = [];
  print = process.env.NODE_ENV === "development" ? levels.warn : levels.error;

  log(message: string, severity: Severity, prefix: string[]): void {
    this.logs.push(
      [Date.now(), severity, `[${prefix.join(".")}]`, message].join(" ")
    );

    if (levels[severity] >= this.print) {
      // eslint-disable-next-line no-console
      console.log(
        [
          `%c${Date.now()}`,
          `%c[${severity}]`,
          `%c[${prefix.join(".")}]%c`,
          message,
        ].join("\t"),
        "color: #aaaaaa",
        `color: ${colors[severity]}`,
        "color: #00ffff",
        "color: inherit"
      );
    }
  }

  clear(): void {
    this.logs = [];
  }

  sub(prefix: string): SubLogger {
    const logger = new SubLogger(this, prefix);
    return logger;
  }

  search(query: string | RegExp) {
    return this.logs.filter((log) => log.match(query));
  }
}

export const defaultLogger = new Logger();
if (window) {
  window.log = defaultLogger;
}

export const componentLogger = defaultLogger.sub("component");
export const systemLogger = defaultLogger.sub("system");
export const renderLogger = defaultLogger.sub("3d");
