const app = require('../backend/api/index.js');

module.exports = (req, res) => {
  return app(req, res);
};
