import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`===========================================`);
  console.log(`🚀 College ERP Backend running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`===========================================`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

export default server;
