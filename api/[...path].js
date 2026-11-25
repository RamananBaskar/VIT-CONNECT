import server from '../server/server.js';

const { app, initDB } = server;

export default async function handler(req, res) {
  await initDB();
  return app(req, res);
}
