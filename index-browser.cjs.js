const aa = require('./dist/search-insights-browser.cjs.min.js');

module.exports = aa.default;
Object.keys(aa).forEach((key) => {
  if (key !== 'default') {
    module.exports[key] = aa[key];
  }
});
