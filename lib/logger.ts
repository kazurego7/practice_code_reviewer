import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');

const baseOptions: pino.LoggerOptions = {
  level,
  base: undefined,
  redact: {
    paths: ['req.headers.authorization', 'headers.authorization'],
    remove: true,
  },
};

const logger = pino(
  !isProd && (process.env.LOG_PRETTY ?? '1') === '1'
    ? {
        ...baseOptions,
        transport: {
          // pino-pretty を使って開発時に読みやすく出力
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: false,
            ignore: 'pid,hostname',
          },
        },
      }
    : baseOptions
);

export type Logger = ReturnType<typeof logger.child>;

export function getLogger(bindings?: Record<string, unknown>) {
  return bindings ? logger.child(bindings) : logger;
}

export default logger;
