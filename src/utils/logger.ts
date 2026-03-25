type LoggerMethod = 'debug' | 'info' | 'warn' | 'error';
type OutputMode = 'stdio' | 'http';

function getConsoleMethod(method: LoggerMethod): (...args: unknown[]) => void {
  switch (method) {
    case 'debug':
      return console.debug.bind(console);
    case 'info':
      return console.info.bind(console);
    case 'warn':
      return console.warn.bind(console);
    case 'error':
    default:
      return console.error.bind(console);
  }
}

export function createLogger(mode: OutputMode) {
  const write = (method: LoggerMethod, ...args: unknown[]) => {
    if (mode === 'stdio' && method !== 'error' && method !== 'warn') {
      console.error(...args);
      return;
    }

    getConsoleMethod(method)(...args);
  };

  return {
    debug: (...args: unknown[]) => write('debug', ...args),
    info: (...args: unknown[]) => write('info', ...args),
    warn: (...args: unknown[]) => write('warn', ...args),
    error: (...args: unknown[]) => write('error', ...args)
  };
}

export function redirectConsoleLogsToStderr(): void {
  const stderrWriter = (...args: unknown[]) => {
    console.error(...args);
  };

  console.log = stderrWriter;
  console.info = stderrWriter;
  console.debug = stderrWriter;
}
