import { useState, useEffect } from 'react';
import { Task, User, Category, Status, Settings, Notification } from './types';
import { db, auth } from './firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=u1', role: 'Lead Designer' },
  { id: 'u2', name: 'Sarah Miller', avatar: 'https://i.pravatar.cc/150?u=u2', role: 'Project Manager' },
  { id: 'u3', name: 'David Chen', avatar: 'https://i.pravatar.cc/150?u=u3', role: 'Site Supervisor' },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Kitchen', icon: 'Utensils', color: 'bg-blue-500' },
  { id: 'c2', name: 'Bedroom', icon: 'Bed', color: 'bg-green-500' },
  { id: 'c3', name: 'Hall', icon: 'Sofa', color: 'bg-purple-500' },
  { id: 'c4', name: 'Patio', icon: 'Sun', color: 'bg-orange-500' },
  { id: 'c5', name: 'Office', icon: 'Briefcase', color: 'bg-slate-500' },
];

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  workingHours: { start: '09:00', end: '18:00' },
  reminderTiming: 60,
  measurementUnit: 'feet',
  notificationsEnabled: true,
  whatsappEnabled: false,
  whatsappNumber: '',
};

const INITIAL_NOTIFICATIONS: Notification[] = [];

export function useTaskStore() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setTasks([]);
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });

    const settingsRef = doc(db, 'settings', userId);
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Settings);
      } else {
        setDoc(settingsRef, { ...DEFAULT_SETTINGS, userId });
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSettings();
    };
  }, [isAuthReady, userId]);

  // Local storage for users, categories, and notifications
  useEffect(() => {
    const savedUsers = localStorage.getItem('taskflow-users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Failed to parse users");
      }
    }
    const savedCategories = localStorage.getItem('taskflow-categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error("Failed to parse categories");
      }
    }
    const savedNotifications = localStorage.getItem('taskflow-notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error("Failed to parse notifications");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taskflow-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('taskflow-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('taskflow-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return;
    const newTask = {
      timeSpent: 0,
      images: [],
      comments: [],
      materials: [],
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId
    };
    try {
      const newDocRef = doc(collection(db, 'tasks'));
      await setDoc(newDocRef, newTask);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!userId) return;
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const moveTask = async (id: string, newStatus: Status, newIndex?: number) => {
    if (!userId) return;
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!userId) return;
    try {
      const settingsRef = doc(db, 'settings', userId);
      await updateDoc(settingsRef, updates);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: `u-${Date.now()}`,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, ...updates } : u
    ));
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: `c-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const removeCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    isAuthReady,
    userId,
    tasks,
    users,
    categories,
    settings,
    notifications,
    setNotifications,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    updateSettings,
    addUser,
    updateUser,
    removeUser,
    addCategory,
    updateCategory,
    removeCategory,
    markNotificationRead,
    clearNotification
  };
}
