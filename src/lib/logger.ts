type LogMeta = Record<string, unknown>;

export const logger = {
  info(message: string, meta?: LogMeta) {
    if (meta) {
      console.info(message, meta);
    } else {
      console.info(message);
    }
  },
  warn(message: string, meta?: LogMeta) {
    if (meta) {
      console.warn(message, meta);
    } else {
      console.warn(message);
    }
  },
  error(message: string, meta?: LogMeta) {
    if (meta) {
      console.error(message, meta);
    } else {
      console.error(message);
    }
  },
};
