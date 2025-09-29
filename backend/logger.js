const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'requests.log');

function log(obj) {
  const line = `[${new Date().toISOString()}] ${JSON.stringify(obj)}
`;
  fs.appendFile(logFile, line, (err) => { if (err) console.error('Log write error', err); });
  console.log(line.trim());
}

module.exports = { log };