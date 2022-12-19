'use strict';
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./index.production.min.cjs');
} else {
  module.exports = require('./index.development.cjs');
}
