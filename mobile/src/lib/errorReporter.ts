// Typed-logger wrapper — no third-party SDK, no Sentry, no Bugsnag.
// Logs in dev; no-ops in release. Replace with WWF-internal log sink later if needed.
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

function out(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!isDev) return;
  const prefix = `[forest-sentry][${level}]`;
  const payload = meta ? JSON.stringify(meta) : '';
  if (level === 'error') console.error(prefix, message, payload);
  else if (level === 'warn') console.warn(prefix, message, payload);
  else if (level === 'info') console.info(prefix, message, payload);
  else console.log(prefix, message, payload);
}

function describe(error: unknown): { message: string; details?: Record<string, unknown> } {
  if (error instanceof Error) {
    return { message: error.message, details: { stack: error.stack } };
  }
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const message =
      (typeof e.message === 'string' && e.message) ||
      (typeof e.error_description === 'string' && e.error_description) ||
      (typeof e.error === 'string' && e.error) ||
      (typeof e.hint === 'string' && e.hint) ||
      (typeof e.details === 'string' && e.details) ||
      JSON.stringify(error);
    const details: Record<string, unknown> = {};
    for (const k of ['code', 'status', 'statusCode', 'details', 'hint', 'name']) {
      if (e[k] !== undefined) details[k] = e[k];
    }
    return { message, details: Object.keys(details).length ? details : undefined };
  }
  return { message: String(error) };
}

export const errorReporter = {
  debug(message: string, meta?: Record<string, unknown>) {
    out('debug', message, meta);
  },
  info(message: string, meta?: Record<string, unknown>) {
    out('info', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    out('warn', message, meta);
  },
  capture(error: unknown, meta?: Record<string, unknown>) {
    const described = describe(error);
    out('error', described.message, { ...meta, ...(described.details ?? {}) });
  },
};
