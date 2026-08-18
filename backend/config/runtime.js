export function getDatabaseUri() {
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ezfinanz';
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'ezfinanz-dev-secret';
}
