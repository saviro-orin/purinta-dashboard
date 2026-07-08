type LogLevel = 'info' | 'warn' | 'error';

function serialize(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function write(level: LogLevel, scope: string, message: string, context?: Record<string, unknown>) {
  const details = context === undefined ? '' : ` ${serialize(context)}`;
  const line = `${new Date().toISOString()} ${level.toUpperCase()} [${scope}] ${message}${details}`;

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

function createLogger(scope: string) {
  return {
    info(message: string, context?: Record<string, unknown>) {
      write('info', scope, message, context);
    },
    warn(message: string, context?: Record<string, unknown>) {
      write('warn', scope, message, context);
    },
    error(message: string, context?: Record<string, unknown>) {
      write('error', scope, message, context);
    },
  };
}

export { createLogger };
