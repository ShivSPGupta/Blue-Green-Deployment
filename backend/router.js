// Modular routing implementation (uses only `ip` library for CIDR)
const { loadPricing } = require('./loader');
const { log } = require('./logger');
const ipLib = require('ip');
const crypto = require('crypto');

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').map(s => s.trim()).filter(Boolean).reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return acc;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1);
    acc[k] = v;
    return acc;
  }, {});
}

function cidrMatches(ipAddress, cidr) {
  try {
    // ip.cidrSubnet returns object with contains(ip)
    const subnet = ipLib.cidrSubnet(cidr);
    return subnet.contains(ipAddress);
  } catch (e) {
    return false;
  }
}

function makeRouter(config) {
  const cookieName = config.cookieName || 'pricing_version';
  // Normalize percentage
  const pctRaw = config.percentage || { blue: 50, green: 50 };
  const total = (pctRaw.blue || 0) + (pctRaw.green || 0) || 100;
  const pct = {
    blue: Math.round(((pctRaw.blue || 0) / total) * 100),
    green: Math.round(((pctRaw.green || 0) / total) * 100)
  };

  // Preprocess IP rules
  const ipRules = (config.ipRules || []).map(r => ({ cidr: r.cidr, version: (r.version || 'green') }));

  function chooseByPercentage() {
    const n = crypto.randomInt(100) + 1; // 1..100
    return n <= pct.blue ? 'blue' : 'green';
  }

  function chooseByHeader(req) {
    const headerName = (config.headerName || 'x-version').toLowerCase();
    const headerVal = req.headers[headerName];
    if (!headerVal) return null;
    const v = headerVal.toString().toLowerCase();
    if (v === 'blue' || v === 'green') return v;
    return null;
  }

  function chooseByCookie(req) {
    const cookies = parseCookies(req.headers['cookie'] || '');
    const v = cookies[cookieName];
    if (!v) return null;
    const vv = v.toString().toLowerCase();
    if (vv === 'blue' || vv === 'green') return vv;
    return null;
  }

  function chooseByIP(req) {
    const remote = (req.ip || req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
    if (!remote) return null;
    // Normalize IPv6-mapped IPv4
    const normalized = remote.replace(/^::ffff:/, '');
    for (const r of ipRules) {
      if (cidrMatches(normalized, r.cidr)) return r.version;
    }
    return null;
  }

  return async function route(req, res) {
    let chosen = null;

    for (const rule of (config.ruleOrder || ['cookie','header','ip','percentage'])) {
      if (rule === 'cookie') {
        chosen = chooseByCookie(req);
        if (chosen) { log({ method: req.method, url: req.url, rule: 'cookie', client: req.ip, version: chosen }); break; }
      } else if (rule === 'header') {
        chosen = chooseByHeader(req);
        if (chosen) { log({ method: req.method, url: req.url, rule: 'header', client: req.ip, version: chosen }); break; }
      } else if (rule === 'ip') {
        chosen = chooseByIP(req);
        if (chosen) { log({ method: req.method, url: req.url, rule: 'ip', client: req.ip, version: chosen }); break; }
      } else if (rule === 'percentage') {
        chosen = chooseByPercentage();
        log({ method: req.method, url: req.url, rule: 'percentage', client: req.ip, version: chosen });
        break;
      }
    }

    if (!chosen) chosen = 'blue';

    // Sticky cookie set if enabled
    if (config.sticky) {
      const existing = chooseByCookie(req);
      if (!existing) {
        // Preserve any existing Set-Cookie header(s)
        const cookieStr = `${cookieName}=${chosen}; Path=/; Max-Age=${30*24*60*60}; HttpOnly`;
        const prev = res.getHeader('Set-Cookie');
        if (prev) {
          if (Array.isArray(prev)) res.setHeader('Set-Cookie', [...prev, cookieStr]);
          else res.setHeader('Set-Cookie', [prev.toString(), cookieStr]);
        } else {
          res.setHeader('Set-Cookie', cookieStr);
        }
      }
    }

    // load and respond
    const payload = loadPricing(chosen);
    return payload;
  };
}

module.exports = { makeRouter };