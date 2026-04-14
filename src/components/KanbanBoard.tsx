import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, Status, User, Category, Priority } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Calendar, Clock, MessageSquare, MoreHorizontal, CheckSquare, Utensils, Bed, Sofa, Sun, Briefcase, Image as ImageIcon, Package, AlertTriangle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  categories: Category[];
  onMoveTask: (taskId: string, newStatus: Status, newIndex: number) => void;
  onTaskClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMNS: { id: Status; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100/80 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800' },
  { id: 'review', title: 'Review', color: 'bg-amber-100/80 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800' },
  { id: 'done', title: 'Completed', color: 'bg-green-100/80 dark:bg-green-900/40 border border-green-200 dark:border-green-800' },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
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

export function KanbanBoard({ tasks, users, categories, onMoveTask, onTaskClick, onDeleteTask }: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    onMoveTask(draggableId, destination.droppableId as Status, destination.index);
  };

  const getTasksByStatus = (status: Status) => {
    return tasks.filter((task) => task.status === status);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex-1 h-full w-full overflow-x-auto overflow-y-hidden pb-28 md:pb-4 min-h-0">
        <div className="flex gap-4 md:gap-6 h-full px-4 md:px-0 min-w-max md:min-w-0 md:grid md:grid-flow-col md:auto-cols-[calc(50%-12px)] lg:auto-cols-[calc(33.333%-16px)]">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col gap-3 h-full shrink-0 w-[85vw] md:w-auto md:flex-1">
            <div className="flex items-center justify-between px-2 py-1 bg-white/50 dark:bg-slate-900/50 rounded-lg shadow-sm mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", column.color.split(' ')[0].replace('bg-', 'bg-').replace('-100/80', '-500').replace('-200/80', '-500'))} />
                <h3 className="font-bold text-sm tracking-tight uppercase text-slate-800 dark:text-slate-200">{column.title}</h3>
              </div>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                {getTasksByStatus(column.id).length}
              </Badge>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 rounded-2xl p-3 transition-colors min-h-[200px] overflow-y-auto",
                    column.color,
                    snapshot.isDraggingOver && "ring-2 ring-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex flex-col gap-3">
                    {getTasksByStatus(column.id).map((task, index) => {
                      const taskCategories = categories.filter(c => task.categoryIds?.includes(c.id));
                      const totalSubtasks = task.subtasks?.length || 0;
                      const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
                      const pendingSubtasks = totalSubtasks - completedSubtasks;
                      const allCompleted = totalSubtasks > 0 && pendingSubtasks === 0;
                      const noneCompleted = totalSubtasks > 0 && completedSubtasks === 0;
                      
                      let subtaskColorClass = "";
                      if (allCompleted) subtaskColorClass = "text-green-600 dark:text-green-500 font-medium";
                      else if (noneCompleted) subtaskColorClass = "text-red-500 dark:text-red-400 font-medium";
                      else if (totalSubtasks > 0) subtaskColorClass = "text-orange-500 dark:text-orange-400 font-medium";
                      
                      return (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <Card 
                              className={cn(
                                "cursor-pointer transition-all duration-200 border-transparent bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5",
                                snapshot.isDragging && "shadow-xl ring-2 ring-primary/40 rotate-3 scale-105 z-50"
                              )}
                              onClick={() => onTaskClick(task)}
                            >
                              <CardContent className="p-4 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold border-none px-2 py-0.5 rounded-md", PRIORITY_COLORS[task.priority])}>
                                      {task.priority}
                                    </Badge>
                                    {taskCategories.map(category => (
                                      <Badge key={category.id} variant="secondary" className={cn("text-[10px] px-2 py-0.5 flex items-center rounded-md font-medium", category.color, "text-white")}>
                                        {getCategoryIcon(category.icon)}
                                        {category.name}
                                      </Badge>
                                    ))}
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger render={
                                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    } onClick={(e) => e.stopPropagation()} />
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="text-destructive focus:text-destructive">
                                        Delete Task
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                
                                <h4 className="font-semibold text-sm leading-snug text-slate-800 dark:text-slate-200">{task.title}</h4>
                                
                                {task.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50">
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {task.dueDate && (
                                      <div className={cn(
                                        "flex items-center gap-1",
                                        isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'done' ? "text-destructive font-medium" : ""
                                      )}>
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                                      </div>
                                    )}
                                    
                                    {totalSubtasks > 0 && (
                                      <div className={cn(
                                        "flex items-center gap-1",
                                        subtaskColorClass
                                      )}>
                                        {noneCompleted ? (
                                          <AlertTriangle className="h-3.5 w-3.5" />
                                        ) : (
                                          <CheckSquare className="h-3.5 w-3.5" />
                                        )}
                                        <span>
                                          {noneCompleted 
                                            ? `${pendingSubtasks} pending` 
                                            : allCompleted 
                                              ? `${completedSubtasks}/${totalSubtasks}` 
                                              : `${completedSubtasks}/${totalSubtasks} (${pendingSubtasks} pending)`}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {task.materials && task.materials.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Package className="h-3.5 w-3.5" />
                                        <span>
                                          {task.materials.length}
                                          {task.materials.filter(m => m.status === 'pending').length > 0 && (
                                            <span className="text-red-500 dark:text-red-400 text-xs ml-1">
                                              ({task.materials.filter(m => m.status === 'pending').length} pending)
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {task.images && task.images.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <ImageIcon className="h-3.5 w-3.5" />
                                        <span>{task.images.length}</span>
                                      </div>
                                    )}
                                    
                                    {task.timeEstimate > 0 && (
                                      <div className="flex items-center gap-1" title={`Estimate: ${task.timeEstimate}m`}>
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{task.timeSpent > 0 ? formatTime(task.timeSpent) : `${task.timeEstimate}m`}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {task.assignee && (
                                    <div className="text-xs font-medium bg-muted px-2 py-1 rounded-md">
                                      {users.find(u => u.id === task.assignee)?.name.split(' ')[0]}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    )})}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        ))}
        </div>
      </div>
    </DragDropContext>
  );
}
