const { app, initDB } = require('../server/server');

module.exports = async (req, res) => {
  await initDB();
  return app(req, res);
};
