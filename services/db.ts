import { DbSchema, User, AccessCode } from '../types';

const DB_KEY = 'vae_portal_cloud_db';

const INITIAL_DB: DbSchema = {
  users: {
    admin: {
      username: 'admin',
      password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // sha256 of admin123
      name: 'Admin System',
      empId: '0000',
      dept: 'Administration',
      role: 'admin',
      score: 0,
      expiryDate: '2099-12-31T00:00:00.000Z',
      createdAt: new Date().toISOString()
    }
  },
  codes: {
    "SHIFA2025": { code: "SHIFA2025", days: 30, status: "active", createdBy: "System" },
    "TRIAL7": { code: "TRIAL7", days: 7, status: "active", createdBy: "System" }
  }
};

// Simple SHA-256 hash function
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const dbService = {
  init: () => {
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DB));
    }
  },

  getDb: (): DbSchema => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : INITIAL_DB;
  },

  saveDb: (data: DbSchema) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  },

  login: async (username: string, passwordPlain: string): Promise<{ success: boolean; user?: User }> => {
    const db = dbService.getDb();
    
    // Admin override check matches Python logic
    if (username === 'admin' && passwordPlain === 'admin123') {
        const adminUser = db.users['admin'];
        if (adminUser) {
             // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...safeUser } = adminUser;
            return { success: true, user: safeUser as User };
        }
    }

    const user = db.users[username];
    if (!user) return { success: false };

    const hashed = await sha256(passwordPlain);
    if (user.password === hashed) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;
      return { success: true, user: safeUser as User };
    }
    return { success: false };
  },

  register: async (user: User, passwordPlain: string): Promise<{ success: boolean; message: string }> => {
    const db = dbService.getDb();
    if (db.users[user.username]) {
      return { success: false, message: 'اسم المستخدم محجوز مسبقاً ❌' };
    }

    const hashedPassword = await sha256(passwordPlain);
    
    // Create expired user (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newUser: User = {
      ...user,
      password: hashedPassword,
      expiryDate: yesterday.toISOString(),
      createdAt: new Date().toISOString()
    };

    db.users[user.username] = newUser;
    dbService.saveDb(db);
    return { success: true, message: 'تم التسجيل بنجاح! ✅ (الحالة: غير نشط)' };
  },

  activateCode: (username: string, codeStr: string): { success: boolean; days: number } => {
    const db = dbService.getDb();
    const code = db.codes[codeStr];
    const user = db.users[username];

    if (user && code && code.status === 'active') {
      const now = new Date();
      // Add days to current time
      const newExpiry = new Date(now.setDate(now.getDate() + code.days));
      
      // Update user expiry
      user.expiryDate = newExpiry.toISOString();
      db.users[username] = user;

      // Mark code as used (Single use logic)
      code.status = 'used';
      code.usedBy = username;
      code.usedAt = new Date().toISOString();
      db.codes[codeStr] = code;

      dbService.saveDb(db);
      return { success: true, days: code.days };
    }
    return { success: false, days: 0 };
  },

  updateScore: (username: string, increment: number) => {
    const db = dbService.getDb();
    if (db.users[username]) {
      db.users[username].score += increment;
      dbService.saveDb(db);
    }
  },
  
  generateCode: (prefix: string, days: number): string => {
     const db = dbService.getDb();
     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
     let randomPart = "";
     for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
     }
     
     const newCodeStr = `${prefix}-${randomPart}`;
     
     db.codes[newCodeStr] = {
       code: newCodeStr,
       days,
       status: 'active',
       createdBy: 'Admin'
     };
     dbService.saveDb(db);
     return newCodeStr;
  }
};