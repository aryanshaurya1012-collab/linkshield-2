// Mock Database & Authentication System for LinkShield
// Uses client-side salted password hashing with Web Crypto for safer demo storage.

const USERS_KEY = 'linkshield_users';
const CURRENT_USER_KEY = 'linkshield_currentUser';
const HASH_ITERATIONS = 120000;
const HASH_ALGORITHM = 'SHA-256';
const MAX_STORED_SCANS = 500;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const textEncoder = new TextEncoder();

const toBase64 = (uint8Array) => btoa(String.fromCharCode(...uint8Array));
const fromBase64 = (base64) => Uint8Array.from(atob(base64), char => char.charCodeAt(0));

const getStoredUsers = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistUsers = (users) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist users to localStorage', err);
  }
};

let inMemoryUsers = getStoredUsers();

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

export const registerUser = async (username, password) => {
  await delay(400); // Simulate network latency
  inMemoryUsers = getStoredUsers();

  const normalizedUsername = username.trim().toLowerCase();
  if (inMemoryUsers.find(u => u.username.toLowerCase() === normalizedUsername)) {
    throw new Error('User already exists');
  }

  const passwordRecord = await createPasswordRecord(password);
  const newUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    password: passwordRecord,
    createdAt: new Date().toISOString()
  };

  inMemoryUsers.push(newUser);
  persistUsers(inMemoryUsers);

  const sessionUser = createSessionPayload(newUser);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
  return sessionUser;
};

export const loginUser = async (username, password) => {
  await delay(350);
  inMemoryUsers = getStoredUsers();

  const normalizedUsername = username.trim().toLowerCase();
  const userIndex = inMemoryUsers.findIndex(u => u.username.toLowerCase() === normalizedUsername);
  const user = userIndex >= 0 ? inMemoryUsers[userIndex] : null;

  if (!user) {
    throw new Error('Invalid credentials. Access Denied.');
  }

  let isValid = false;

  if (typeof user.password === 'string') {
    // Legacy migration path from previous plaintext demo storage
    isValid = user.password === password;
    if (isValid) {
      const upgradedPasswordRecord = await createPasswordRecord(password);
      inMemoryUsers[userIndex] = { ...user, password: upgradedPasswordRecord };
      persistUsers(inMemoryUsers);
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
  await delay(200);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(CURRENT_USER_KEY);
  if (!user) return null;

  try {
    const parsed = JSON.parse(user);
    if (!parsed?.id || !parsed?.username) return null;

    inMemoryUsers = getStoredUsers();
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
  if (!userId || typeof window === 'undefined') return null;

  try {
    const storageKey = `linkshield_scans_${userId}`;
    const raw = localStorage.getItem(storageKey);
    let scans = [];
    if (raw) {
      try {
        scans = JSON.parse(raw);
        if (!Array.isArray(scans)) scans = [];
      } catch {
        scans = [];
      }
    }

    const newScan = {
      ...scanData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    scans.unshift(newScan);

    // Keep history bounded to avoid localStorage quota exhaustion
    if (scans.length > MAX_STORED_SCANS) {
      scans = scans.slice(0, MAX_STORED_SCANS);
    }

    localStorage.setItem(storageKey, JSON.stringify(scans));
    return newScan;
  } catch (err) {
    console.error('Failed to save scan record', err);
    return null;
  }
};

export const getUserScans = async (userId) => {
  if (!userId || typeof window === 'undefined') return [];
  await delay(250);

  try {
    const raw = localStorage.getItem(`linkshield_scans_${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const deleteScan = async (userId, scanId) => {
  if (!userId || !scanId || typeof window === 'undefined') return [];
  try {
    const storageKey = `linkshield_scans_${userId}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const scans = JSON.parse(raw);
    const updated = Array.isArray(scans) ? scans.filter(s => s.id !== scanId) : [];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete scan', err);
    return [];
  }
};

export const clearUserScans = async (userId) => {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`linkshield_scans_${userId}`);
  } catch (err) {
    console.error('Failed to clear scans', err);
  }
};
