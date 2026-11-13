import { createApp } from './app.js';
import { getPort } from './config/env.js';
import { getDataSource } from './db/data-source.js';
import { logger } from './shared/logger.js';

const main = async (): Promise<void> => {
  await getDataSource();
  const port = getPort();
  createApp().listen(port, () => logger.info('Server listening', { port }));
};

main().catch((error: unknown) => {
  logger.error('Startup failed', error);
  process.exit(1);
});
