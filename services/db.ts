// src/services/db.ts
import { db } from '../src/lib/firebase';
import { 
  doc, getDoc, setDoc, updateDoc, 
  collection, getDocs, query, increment 
} from 'firebase/firestore';
import { User, AccessCode } from '../types';

// دالة التشفير (بقيت كما هي لحماية كلمات المرور)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const dbService = {
  // دالة تهيئة فارغة للحفاظ على توافق الكود
  init: () => {},

  // 1. جلب كل المستخدمين (للأدمن)
  getAllUsers: async (): Promise<User[]> => {
    const q = query(collection(db, "users"));
    const snapshot = await getDocs(q);
    // نستثني الأدمن من القائمة عشان ما يظهر لنفسه
    return snapshot.docs.map(doc => doc.data() as User).filter(u => u.role !== 'admin');
  },

  // 2. جلب كل الأكواد (للأدمن)
  getAllCodes: async (): Promise<AccessCode[]> => {
    const q = query(collection(db, "codes"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AccessCode);
  },

  // 3. تسجيل الدخول
  login: async (username: string, passwordPlain: string): Promise<{ success: boolean; user?: User }> => {
    try {
      // السماح للأدمن بالدخول حتى لو لم يكن في قاعدة البيانات (لأول مرة)
      if (username === 'admin' && passwordPlain === 'admin123') {
         // نحاول نجلب بياناته لو كانت موجودة
         const adminRef = doc(db, "users", "admin");
         const adminSnap = await getDoc(adminRef);
         if (adminSnap.exists()) return { success: true, user: adminSnap.data() as User };
         
         // لو مو موجود (أول مرة)، نرجع يوزر مؤقت عشان تقدر تدخل وتنشئه
         return { success: true, user: { 
             username: 'admin', name: 'System Admin', role: 'admin', 
             dept: 'IT', empId: '000', score: 0, expiryDate: '2099-01-01', createdAt: new Date().toISOString() 
         }};
      }

      // تسجيل دخول المستخدمين العاديين
      const userRef = doc(db, "users", username);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        const hashed = await sha256(passwordPlain);
        // مقارنة الهاش للتأكد من كلمة المرور
        if (userData.password === hashed) {
          return { success: true, user: userData };
        }
      }
      return { success: false };
    } catch (e) {
      console.error("Login Error:", e);
      return { success: false };
    }
  },

  // 4. تسجيل مستخدم جديد
  register: async (user: User, passwordPlain: string): Promise<{ success: boolean; message: string }> => {
    try {
      const userRef = doc(db, "users", user.username);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { success: false, message: 'اسم المستخدم محجوز مسبقاً ❌' };
      }

      const hashedPassword = await sha256(passwordPlain);
      
      // تعيين تاريخ انتهاء في الماضي (عشان يحتاج كود تفعيل)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const newUser: User = {
        ...user,
        password: hashedPassword,
        expiryDate: yesterday.toISOString(),
        createdAt: new Date().toISOString()
      };

      await setDoc(userRef, newUser);
      return { success: true, message: 'تم التسجيل بنجاح! ✅' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'حدث خطأ في الاتصال' };
    }
  },

  // 5. تفعيل كود الاشتراك
  activateCode: async (username: string, codeStr: string): Promise<{ success: boolean; days: number }> => {
    try {
      const codeRef = doc(db, "codes", codeStr);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) return { success: false, days: 0 };

      const codeData = codeSnap.data() as AccessCode;
      if (codeData.status !== 'active') return { success: false, days: 0 };

      const userRef = doc(db, "users", username);
      const now = new Date();
      // إضافة أيام الكود لتاريخ اليوم
      const newExpiry = new Date(now.setDate(now.getDate() + codeData.days));

      // تحديث المستخدم والكود معاً (يفضل استخدام batch في التطبيقات الكبيرة بس هذا يفي بالغرض)
      await updateDoc(userRef, { expiryDate: newExpiry.toISOString() });
      await updateDoc(codeRef, { 
          status: 'used', 
          usedBy: username, 
          usedAt: new Date().toISOString() 
      });

      return { success: true, days: codeData.days };
    } catch (e) {
      return { success: false, days: 0 };
    }
  },

  // 6. تحديث النقاط (زيادة)
  updateScore: async (username: string, incrementVal: number) => {
    const userRef = doc(db, "users", username);
    await updateDoc(userRef, {
      score: increment(incrementVal)
    });
  },
  
  // 7. توليد كود جديد وحفظه في السحابة
  generateCode: async (prefix: string, days: number): Promise<string> => {
     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
     let randomPart = "";
     for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
     }
     const newCodeStr = `${prefix}-${randomPart}`;
     
     await setDoc(doc(db, "codes", newCodeStr), {
       code: newCodeStr, days, status: 'active', createdBy: 'Admin'
     });
     return newCodeStr;
  },

  // 8. جلب بيانات مستخدم واحد (لتحديث الواجهة)
  getUser: async (username: string): Promise<User | null> => {
    const snap = await getDoc(doc(db, "users", username));
    return snap.exists() ? snap.data() as User : null;
  }
};
