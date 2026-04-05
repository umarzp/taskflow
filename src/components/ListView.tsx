import React from 'react';
import { Task, User, Category, Priority, Status } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { MoreHorizontal, Calendar, Clock, CheckSquare, Utensils, Bed, Sofa, Sun, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface ListViewProps {
  tasks: Task[];
  users: User[];
  categories: Category[];
  onTaskClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_COLORS: Record<Status, string> = {
  'todo': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  'in-progress': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'review': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'done': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800',
};

const STATUS_LABELS: Record<Status, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'review': 'Review',
  'done': 'Completed',
};

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Utensils': return <Utensils className="h-3 w-3 mr-1" />;
    case 'Bed': return <Bed className="h-3 w-3 mr-1" />;
    case 'Sofa': return <Sofa className="h-3 w-3 mr-1" />;
    case 'Sun': return <Sun className="h-3 w-3 mr-1" />;
    case 'Briefcase': return <Briefcase className="h-3 w-3 mr-1" />;
    default: return null;
  }
};

export function ListView({ tasks, users, categories, onTaskClick, onDeleteTask }: ListViewProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No tasks found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const category = categories.find(c => c.id === task.categoryId);
              return (
              <TableRow 
                key={task.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onTaskClick(task)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span className="line-clamp-1">{task.title}</span>
                    <div className="flex flex-wrap gap-1">
                      {category && (
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 flex items-center w-fit", category.color, "text-white")}>
                          {getCategoryIcon(category.icon)}
                          {category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", STATUS_COLORS[task.status])}>
                    {STATUS_LABELS[task.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-semibold border-none px-1.5 py-0", PRIORITY_COLORS[task.priority])}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.assignee ? (
                    <Avatar className="h-6 w-6 border border-background">
                      <AvatarImage src={users.find(u => u.id === task.assignee)?.avatar} />
                      <AvatarFallback className="text-[10px]">
                        {users.find(u => u.id === task.assignee)?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.dueDate ? (
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'done' ? "text-destructive font-medium" : "text-muted-foreground"
                    )}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                      </div>
                    )}
                    {task.timeSpent > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatTime(task.timeSpent)}</span>
                      </div>
                    )}
                    {task.subtasks.length === 0 && task.timeSpent === 0 && (
                      <span>-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="text-destructive focus:text-destructive">
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})
          )}
        </TableBody>
      </Table>
    </div>
  );
}
