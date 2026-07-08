// Mock Database & Authentication System for LinkShield
// In a production environment, replace this with Firebase or a Node.js/MongoDB backend.

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const registerUser = async (username, password) => {
  await delay(600); // Simulate network latency
  const users = JSON.parse(localStorage.getItem('linkshield_users') || '[]');
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('User already exists');
  }
  const newUser = { id: crypto.randomUUID(), username: username.toLowerCase(), password }; // Storing raw password is for demo only!
  users.push(newUser);
  localStorage.setItem('linkshield_users', JSON.stringify(users));
  
  localStorage.setItem('linkshield_currentUser', JSON.stringify(newUser));
  return newUser;
};

export const loginUser = async (username, password) => {
  await delay(500);
  const users = JSON.parse(localStorage.getItem('linkshield_users') || '[]');
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (!user) {
    throw new Error('Invalid credentials. Access Denied.');
  }
  localStorage.setItem('linkshield_currentUser', JSON.stringify(user));
  return user;
};

export const logoutUser = async () => {
  await delay(300);
  localStorage.removeItem('linkshield_currentUser');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('linkshield_currentUser');
  return user ? JSON.parse(user) : null;
};

export const saveScan = async (userId, scanData) => {
  // Fire-and-forget logic simulates real-time push
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
