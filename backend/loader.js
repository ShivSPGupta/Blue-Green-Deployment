const fs = require('fs');
const path = require('path');

function loadPricing(version) {
  const file = path.join(__dirname, 'pricing', `${version}.json`);
  if (!fs.existsSync(file)) throw new Error(`Pricing file missing for version: ${version}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = { loadPricing };