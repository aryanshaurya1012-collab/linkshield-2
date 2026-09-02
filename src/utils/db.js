// Mock Database & Authentication System for LinkShield
// Uses client-side salted password hashing with Web Crypto for safer demo storage.

const USERS_KEY = 'linkshield_users';
const CURRENT_USER_KEY = 'linkshield_currentUser';
const HASH_ITERATIONS = 120000;
const HASH_ALGORITHM = 'SHA-256';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const textEncoder = new TextEncoder();
let inMemoryUsers = [];

const toBase64 = (uint8Array) => btoa(String.fromCharCode(...uint8Array));
const fromBase64 = (base64) => Uint8Array.from(atob(base64), char => char.charCodeAt(0));

const createSessionPayload = (user) => ({
  id: user.id,
  username: user.username,
  sessionToken: crypto.randomUUID(),
  sessionCreatedAt: new Date().toISOString()
});

const hashPasswordWithSalt = async (password, saltBytes) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: HASH_ITERATIONS,
      hash: HASH_ALGORITHM
    },
    keyMaterial,
    256
  );

  return new Uint8Array(derivedBits);
};

const createPasswordRecord = async (password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hashBytes = await hashPasswordWithSalt(password, salt);
  return {
    salt: toBase64(salt),
    hash: toBase64(hashBytes),
    iterations: HASH_ITERATIONS,
    algorithm: HASH_ALGORITHM
  };
};

const verifyPassword = async (password, passwordRecord) => {
  if (!passwordRecord?.salt || !passwordRecord?.hash) return false;
  const saltBytes = fromBase64(passwordRecord.salt);
  const incomingHash = await hashPasswordWithSalt(password, saltBytes);
  return toBase64(incomingHash) === passwordRecord.hash;
};

const bootstrapLegacyUsers = () => {
  try {
    const legacyUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (Array.isArray(legacyUsers)) {
      inMemoryUsers = legacyUsers;
    }
    localStorage.removeItem(USERS_KEY);
  } catch {
    inMemoryUsers = [];
  }
};

if (typeof window !== 'undefined') {
  bootstrapLegacyUsers();
}

export const registerUser = async (username, password) => {
  await delay(600); // Simulate network latency
  if (inMemoryUsers.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('User already exists');
  }

  const passwordRecord = await createPasswordRecord(password);
  const newUser = {
    id: crypto.randomUUID(),
    username: username.toLowerCase(),
    password: passwordRecord
  };

  inMemoryUsers.push(newUser);

  const sessionUser = createSessionPayload(newUser);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
  return sessionUser;
};

export const loginUser = async (username, password) => {
  await delay(500);
  const userIndex = inMemoryUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  const user = userIndex >= 0 ? inMemoryUsers[userIndex] : null;

  if (!user) {
    throw new Error('Invalid credentials. Access Denied.');
  }

  let isValid = false;

  if (typeof user.password === 'string') {
    // Legacy migration path from previous plaintext demo storage.
    isValid = user.password === password;
    if (isValid) {
      const upgradedPasswordRecord = await createPasswordRecord(password);
      inMemoryUsers[userIndex] = { ...user, password: upgradedPasswordRecord };
    }
  } else {
    isValid = await verifyPassword(password, user.password);
  }

  if (!isValid) {
    throw new Error('Invalid credentials. Access Denied.');
  }

  const sessionUser = createSessionPayload(user);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
  return sessionUser;
};

export const logoutUser = async () => {
  await delay(300);
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = () => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  if (!user) return null;

  try {
    const parsed = JSON.parse(user);
    if (!parsed?.id || !parsed?.username) return null;
    const exists = inMemoryUsers.some((storedUser) => storedUser.id === parsed.id);
    if (!exists) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveScan = async (userId, scanData) => {
  setTimeout(() => {
    const scans = JSON.parse(localStorage.getItem(`linkshield_scans_${userId}`) || '[]');
    scans.unshift({
      ...scanData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(`linkshield_scans_${userId}`, JSON.stringify(scans));
  }, 100);
};

export const getUserScans = async (userId) => {
  await delay(400);
  return JSON.parse(localStorage.getItem(`linkshield_scans_${userId}`) || '[]');
};
