import test from 'node:test';
import assert from 'node:assert/strict';

import { getDatabaseUri, getJwtSecret } from '../config/runtime.js';

test('uses a safe local Mongo URI by default', () => {
  const original = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  try {
    assert.equal(getDatabaseUri(), 'mongodb://127.0.0.1:27017/ezfinanz');
  } finally {
    if (original === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = original;
  }
});

test('uses a dev JWT secret by default', () => {
  const original = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  try {
    assert.equal(getJwtSecret(), 'ezfinanz-dev-secret');
  } finally {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  }
});
