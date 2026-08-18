const SystemConfig = require('../models/SystemConfig');

// In-memory cache: DB values take priority over process.env
const _cache = {};

const get = async (key) => {
  if (_cache[key] !== undefined) return _cache[key];

  try {
    const doc = await SystemConfig.findOne({ key }).lean();
    if (doc && doc.value) {
      _cache[key] = doc.value;
      return doc.value;
    }
  } catch (_) {}

  // Fallback to env
  const envVal = process.env[key] || '';
  _cache[key] = envVal;
  return envVal;
};

const set = async (key, value) => {
  await SystemConfig.findOneAndUpdate(
    { key },
    { key, value: value || '' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  _cache[key] = value || '';
};

// Call after updating to force re-read on next get()
const invalidate = (key) => { delete _cache[key]; };
const invalidateAll = () => { Object.keys(_cache).forEach((k) => delete _cache[k]); };

module.exports = { get, set, invalidate, invalidateAll };
