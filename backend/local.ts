import 'dotenv/config';
import { createApp } from './server.ts';

const port = Number(process.env.PORT) || 3000;

createApp()
  .then((app) => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`KrishiBondhu server running on http://localhost:${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('Unable to start KrishiBondhu server:', error);
    process.exitCode = 1;
  });
