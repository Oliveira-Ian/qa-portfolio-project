import 'dotenv/config';
import { buildApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
// 0.0.0.0, not the Fastify default of localhost — otherwise the server is
// unreachable from outside a Docker container even with the port published.
const HOST = process.env.HOST || '0.0.0.0';

const app = buildApp();

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }

  console.log(`Server running on http://localhost:${PORT}`);
});
