import path from "node:path";
import pino from "pino";

const fileTransport = pino.transport({
  target: "pino/file",
  options: {
    destination: path.resolve(import.meta.dir, `../../${process.env.LOG_FILE}`),
  },
});

export const fileLogger = pino({ level: Bun.env.LOG_LEVEL }, fileTransport);
export const consoleLogger = pino({ level: Bun.env.LOG_LEVEL });
