// Simple Express server exposing /pricing
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { makeRouter } = require('./router');
const { log } = require('./logger');

// Load config (config.json or environment overrides)
const cfgPath = path.join(__dirname, 'config.json');
let config = {};
if (fs.existsSync(cfgPath)) config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

// env overrides
if (process.env.RULE_ORDER) config.ruleOrder = process.env.RULE_ORDER.split(',');
if (process.env.COOKIE_NAME) config.cookieName = process.env.COOKIE_NAME;
if (process.env.HEADER_NAME) config.headerName = process.env.HEADER_NAME;
if (process.env.PERCENT_BLUE) config.percentage = { blue: parseInt(process.env.PERCENT_BLUE,10), green: parseInt(process.env.PERCENT_GREEN || (100 - parseInt(process.env.PERCENT_BLUE,10)),10)};
if (process.env.STICKY) config.sticky = process.env.STICKY === 'true';

const app = express();

app.use(cors({
  origin: 'https://blue-green-deployment-1.onrender.com',
}));

if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

const router = makeRouter(config);

app.get('/pricing', async (req, res) => {
  try {
    const payload = await router(req, res);
    log({ path: '/pricing', method: req.method, ip: req.ip, servedVersion: payload.version });
    res.json(payload);
  } catch (err) {
    console.error('Error serving /pricing', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Serve frontend static when built (optional)
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, () => console.log(`Pricing server listening on ${PORT}`));