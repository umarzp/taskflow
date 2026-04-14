export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in-progress' | 'review' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
}

export interface Material {
  id: string;
  name: string;
  vendor: string;
  status: 'pending' | 'ordered' | 'delivered';
  cost?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  categoryId: string | null;
  dueDate: string | null;
  timeEstimate: number; // in minutes
  assignee: string | null;
  subtasks: Subtask[];
  timeSpent: number; // in seconds
  images: string[];
  comments: Comment[];
  materials: Material[];
  budget: number;
  createdAt: string;
  updatedAt: string;
  priorityAlertSent?: boolean;
  overdueAlertSent?: boolean;
  reminderAlertSent?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'overdue' | 'priority' | 'system';
  read: boolean;
  createdAt: string;
  taskId?: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  workingHours: { start: string; end: string };
  reminderTiming: number; // minutes before
  measurementUnit: 'feet' | 'inches' | 'meters';
  notificationsEnabled: boolean;
  whatsappEnabled?: boolean;
  whatsappNumber?: string;
  lastWhatsAppSent?: string;
}
