import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = buildApp();

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    // Closing the app drains in-flight requests and runs the onClose hook that
    // disconnects Prisma — without it a container restart leaves sessions open.
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error(error);
        process.exit(1);
      },
    );
  });
}

app.listen({ port: env.PORT, host: env.HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }

  app.log.info(`API listening on http://localhost:${env.PORT}`);
});
