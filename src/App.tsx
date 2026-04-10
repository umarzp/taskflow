import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTaskStore } from './store';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { TaskDialog } from './components/TaskDialog';
import { NotificationsPanel } from './components/NotificationsPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { Task } from './types';
import { Button } from './components/ui/button';
import { Plus, LayoutGrid, List as ListIcon, Search, Settings as SettingsIcon, CheckSquare, Clock, CheckCircle2, CircleDashed, LogIn, LogOut } from 'lucide-react';
import { Input } from './components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from './components/ui/dropdown-menu';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { requestNotificationPermission, sendPushNotification } from './lib/notifications';
import { isAfter, parseISO, subMinutes } from 'date-fns';

export default function App() {
  const { 
    tasks, users, categories, settings, notifications,
    addTask, updateTask, deleteTask, moveTask,
    addUser, updateUser, removeUser,
    updateSettings, markNotificationRead, clearNotification,
    setNotifications,
    isAuthReady, userId
  } = useTaskStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.substring(1) || 'board';

  // 🔔 Notification permission
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [settings.notificationsEnabled]);

  // 🔔 Reminder logic
  useEffect(() => {
    if (!settings.notificationsEnabled || !userId) return;

    const checkReminders = () => {
      const now = new Date();

      tasks.forEach(task => {
        if (task.status === 'done' || !task.dueDate) return;

        const dueDate = parseISO(task.dueDate);
        const reminderTime = subMinutes(dueDate, settings.reminderTiming);

        if (
          isAfter(now, reminderTime) &&
          !isAfter(now, dueDate) &&
          !notifiedTasks.has(task.id)
        ) {
          sendPushNotification('Task Reminder', {
            body: `${task.title} is due soon`,
          });

          setNotifiedTasks(prev => new Set(prev).add(task.id));
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [tasks, settings, notifiedTasks, userId]);

  // 🔐 Auth
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!isAuthReady) return <div>Loading...</div>;

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Button onClick={handleLogin}>Login with Google</Button>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dashboard Summary calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pendingTasks = totalTasks - completedTasks;
  const totalTimeSpent = tasks.reduce((acc, task) => acc + task.timeSpent, 0);
  const hoursSpent = Math.floor(totalTimeSpent / 3600);
  const minutesSpent = Math.floor((totalTimeSpent % 3600) / 60);

  return (
    <div className={`min-h-[100dvh] ${settings.theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex font-sans overflow-hidden`}>
      {/* Background Gradient/Glassmorphism */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"></div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-20 border-r bg-background/80 backdrop-blur-md items-center py-6 gap-8 z-20 fixed left-0 top-0 bottom-0">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <CheckSquare className="h-6 w-6 text-white" />
        </div>
        <nav className="flex flex-col gap-4 w-full px-3">
          <Button variant={activeTab === 'board' ? 'secondary' : 'ghost'} size="icon" className="w-full h-12 rounded-xl" onClick={() => navigate('/board')} title="Tasks">
            <CheckSquare className="h-5 w-5" />
          </Button>
          <Button variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} size="icon" className="w-full h-12 rounded-xl" onClick={() => navigate('/dashboard')} title="Dashboard">
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button variant={activeTab === 'list' ? 'secondary' : 'ghost'} size="icon" className="w-full h-12 rounded-xl" onClick={() => navigate('/list')} title="List View">
            <ListIcon className="h-5 w-5" />
          </Button>
          <div className="w-full h-px bg-border my-2"></div>
          <Button variant="ghost" size="icon" className="w-full h-12 rounded-xl relative" onClick={() => setIsSettingsOpen(true)} title="Settings">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </nav>
        <div className="mt-auto">
          {auth.currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm cursor-pointer hover:ring-2 ring-primary/20 transition-all">
                    <AvatarImage src={auth.currentUser?.photoURL || "https://i.pravatar.cc/150?u=current"} />
                    <AvatarFallback>{auth.currentUser?.displayName?.charAt(0) || 'ME'}</AvatarFallback>
                  </Avatar>
                </button>
              } />
              <DropdownMenuContent align="end" side="right" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{auth.currentUser?.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{auth.currentUser?.email || ''}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden relative md:ml-20 w-full">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className="w-full max-w-6xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-4 md:hidden">
              <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                TaskFlow
              </div>
            </div>
            
            <div className="hidden md:flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">Interior Design Workflow</h1>
              <p className="text-muted-foreground text-xs">Manage your daily site work efficiently.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-64 hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tasks..."
                  className="h-10 w-full rounded-full bg-muted/50 border-transparent focus-visible:ring-primary pl-10 text-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <NotificationsPanel 
                notifications={notifications}
                markNotificationRead={markNotificationRead}
                clearNotification={clearNotification}
              />
              <Button onClick={() => { setSelectedTask(null); setIsDialogOpen(true); }} className="hidden md:flex rounded-full px-6 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                <Plus className="h-4 w-4 mr-2" /> New Task
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden p-4 md:p-6 pb-24 md:pb-6 flex flex-col gap-4 w-full max-w-[1600px] mx-auto">
          {/* Mobile search */}
          <div className="relative w-full lg:hidden shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="h-10 w-full rounded-xl bg-white dark:bg-slate-900 border-border shadow-sm pl-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Dashboard Summary */}
          <div className={`${activeTab !== 'dashboard' ? 'hidden md:grid' : 'grid'} gap-3 grid-cols-2 lg:grid-cols-4 shrink-0`}>
            <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Tasks</p>
                  <div className="text-xl font-bold leading-none mt-1">{totalTasks}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Completed</p>
                  <div className="text-xl font-bold leading-none mt-1">{completedTasks}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                  <div className="text-xl font-bold leading-none mt-1">{pendingTasks}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <CircleDashed className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Time Spent</p>
                  <div className="text-xl font-bold leading-none mt-1">{hoursSpent}h {minutesSpent}m</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <Routes>
              <Route path="/" element={<Navigate to="/board" replace />} />
              <Route path="/board" element={
                <KanbanBoard 
                  tasks={filteredTasks} 
                  users={users} 
                  categories={categories} 
                  onMoveTask={moveTask} 
                  onTaskClick={(t) => {
                    setSelectedTask(t);
                    setIsDialogOpen(true);
                  }}
                  onDeleteTask={deleteTask}
                />
              } />
              <Route path="/dashboard" element={
                <KanbanBoard 
                  tasks={filteredTasks} 
                  users={users} 
                  categories={categories} 
                  onMoveTask={moveTask} 
                  onTaskClick={(t) => {
                    setSelectedTask(t);
                    setIsDialogOpen(true);
                  }}
                  onDeleteTask={deleteTask}
                />
              } />
              <Route path="/list" element={
                <ListView 
                  tasks={filteredTasks} 
                  users={users} 
                  categories={categories} 
                  onTaskClick={(t) => {
                    setSelectedTask(t);
                    setIsDialogOpen(true);
                  }}
                  onDeleteTask={deleteTask}
                />
              } />
            </Routes>
          </div>
        </main>
      </div>

      {/* Floating Action Button (Mobile) */}
      <Button 
        onClick={() => {
          setSelectedTask(null);
          setIsDialogOpen(true);
        }} 
        size="icon" 
        className="md:hidden fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-primary/30 z-40"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t flex justify-around items-center p-2 z-[100] pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Button 
          variant={activeTab === 'board' ? 'default' : 'ghost'} 
          className="flex-1 mx-1 h-12 rounded-xl" 
          onClick={() => navigate('/board')}
        >
          <CheckSquare className="h-5 w-5" />
        </Button>
        <Button 
          variant={activeTab === 'list' ? 'default' : 'ghost'} 
          className="flex-1 mx-1 h-12 rounded-xl" 
          onClick={() => navigate('/list')}
        >
          <ListIcon className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          className="flex-1 mx-1 h-12 rounded-xl text-muted-foreground" 
          onClick={() => setIsSettingsOpen(true)}
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </nav>

      <TaskDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        task={selectedTask}
        users={users}
        categories={categories}
        onSave={(data) => {
          if (selectedTask) {
            updateTask(selectedTask.id, data);
          } else {
            addTask(data as any);
          }
        }}
        addUser={addUser}
        updateUser={updateUser}
        removeUser={removeUser}
        onDelete={(id) => {
          deleteTask(id);
          setIsDialogOpen(false);
        }}
      />

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        updateSettings={updateSettings}
      />
    </div>
  );
}