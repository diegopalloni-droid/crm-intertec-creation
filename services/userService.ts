import { User } from '../types';

const USERS_STORAGE_KEY = 'app_users';

const getUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersJson) return [];
  try {
    const users = JSON.parse(usersJson);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    return [];
  }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const initializeUsers = () => {
    let users = getUsers();
    
    // If the data is from the old version (with emails), reset to the new structure.
    if (users.some(u => 'email' in u)) {
        users = [];
    }

    let wasUpdated = false;

    if (!users.some(u => u.username === 'master')) {
        users.push({
            id: 'master001',
            username: 'master',
            name: 'Admin',
            isActive: true,
        });
        wasUpdated = true;
    }
    
    if (!users.some(u => u.username === 'mario.rossi')) {
        users.push({
            id: 'user_demo_001',
            username: 'mario.rossi',
            name: 'Mario Rossi',
            isActive: true,
            password: 'password123',
        });
        wasUpdated = true;
    } else {
      const demoUserIndex = users.findIndex(u => u.username === 'mario.rossi');
      if (demoUserIndex > -1 && !users[demoUserIndex].password) {
        users[demoUserIndex].password = 'password123';
        wasUpdated = true;
      }
    }

    if (wasUpdated) {
        saveUsers(users);
    }
};

initializeUsers();

export const userService = {
  async getUsers(): Promise<User[]> {
    return getUsers();
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const users = getUsers();
    return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async addUser(username: string, name: string, password?: string): Promise<{ success: boolean; message?: string }> {
    const users = getUsers();
    const usernameLower = username.toLowerCase().trim();

    if (!usernameLower) {
        return { success: false, message: 'Il nome utente è obbligatorio.' };
    }

    if (users.some(user => user.username.toLowerCase() === usernameLower)) {
      return { success: false, message: 'Questo nome utente esiste già.' };
    }
    
    if (!password || password.length < 6) {
        return { success: false, message: 'La password è obbligatoria e deve essere di almeno 6 caratteri.' };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username: usernameLower,
      name: name.trim() || usernameLower,
      isActive: true,
      password: password,
    };

    users.push(newUser);
    saveUsers(users);
    return { success: true };
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    let users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return null;
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    return users[userIndex];
  },

  async deleteUser(userId: string): Promise<void> {
    let users = getUsers();
    users = users.filter(user => user.id !== userId);
    saveUsers(users);
  },
};