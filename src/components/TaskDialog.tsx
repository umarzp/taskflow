import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Task, User, Category, Priority, Status, Subtask, Material, Comment } from '../types';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Clock, Play, Square, Package, Image as ImageIcon, MessageSquare, Sparkles, Loader2, Edit2, CheckSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generateTaskSuggestions } from '../services/geminiService';
import { useTaskStore } from '../store';

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  users: User[];
  categories: Category[];
  onSave: (task: Partial<Task>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskDialog({ open, onOpenChange, task, users, categories, onSave, addUser, updateUser, removeUser, onDelete }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('todo');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assignee, setAssignee] = useState<string>('none');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [timeEstimate, setTimeEstimate] = useState<number>(0);
  const [budget, setBudget] = useState<number>(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialVendor, setNewMaterialVendor] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Timer state
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  
  // AI state
  const [isGenerating, setIsGenerating] = useState(false);

  // Manage Users state
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');

  // Mode state
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setAssignee(task.assignee || 'none');
      setCategoryId(task.categoryId || 'none');
      setSubtasks(task.subtasks);
      setTimeEstimate(task.timeEstimate || 0);
      setBudget(task.budget || 0);
      setMaterials(task.materials || []);
      setImages(task.images || []);
      setComments(task.comments || []);
      setTimeSpent(task.timeSpent);
      setIsTracking(false);
      setIsEditing(false);
    } else if (open) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate(undefined);
      setAssignee('none');
      setCategoryId('none');
      setSubtasks([]);
      setTimeEstimate(0);
      setBudget(0);
      setMaterials([]);
      setImages([]);
      setComments([]);
      setTimeSpent(0);
      setIsTracking(false);
      setIsEditing(true);
    }
  }, [task, open]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? dueDate.toISOString() : null,
      assignee: assignee === 'none' ? null : assignee,
      categoryId: categoryId === 'none' ? null : categoryId,
      timeEstimate,
      budget,
      materials,
      images,
      comments,
      subtasks,
      timeSpent,
    });
    
    if (!task) {
      onOpenChange(false);
    } else {
      setIsEditing(false);
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: `st-${Date.now()}`, title: newSubtask, completed: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const addMaterial = () => {
    if (!newMaterialName.trim()) return;
    setMaterials([...materials, { 
      id: `m-${Date.now()}`, 
      name: newMaterialName, 
      vendor: newMaterialVendor || 'Unknown', 
      status: 'pending' 
    }]);
    setNewMaterialName('');
    setNewMaterialVendor('');
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const toggleMaterialStatus = (id: string) => {
    setMaterials(materials.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === 'pending' ? 'ordered' : m.status === 'ordered' ? 'delivered' : 'pending';
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl]);
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, {
      id: `c-${Date.now()}`,
      text: newComment,
      createdAt: new Date().toISOString(),
      authorId: 'u1', // Assuming current user is u1 for now
    }]);
    setNewComment('');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleGenerateSuggestions = async () => {
    if (!title.trim()) return;
    setIsGenerating(true);
    try {
      const categoryName = categories.find(c => c.id === categoryId)?.name || 'General';
      const suggestions = await generateTaskSuggestions(title, categoryName);
      if (suggestions.description && !description) {
        setDescription(suggestions.description);
      }
      if (suggestions.subtasks && suggestions.subtasks.length > 0) {
        const newSts = suggestions.subtasks.map((st: string, idx: number) => ({
          id: `st-ai-${Date.now()}-${idx}`,
          title: st,
          completed: false
        }));
        setSubtasks(prev => [...prev, ...newSts]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderViewMode = () => {
    const assignedUser = users.find(u => u.id === assignee);
    const category = categories.find(c => c.id === categoryId);
    
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const pendingSubtasks = totalSubtasks - completedSubtasks;
    const allCompleted = totalSubtasks > 0 && pendingSubtasks === 0;

    return (
      <>
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
              <Badge variant="outline" className="uppercase">{status}</Badge>
              <Badge variant="outline" className={PRIORITY_COLORS[priority]}>{priority}</Badge>
              {category && (
                <Badge variant="secondary" className={cn(category.color, "text-white")}>
                  {category.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Assignee</div>
              <div className="flex items-center gap-2">
                {assignedUser ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignedUser.avatar} />
                      <AvatarFallback>{assignedUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{assignedUser.name}</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">Unassigned</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Due Date</div>
              <div className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {dueDate ? format(dueDate, 'MMM d, yyyy') : 'No date'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Time Tracked</div>
              <div className="text-sm font-medium font-mono flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeSpent)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Checklist</div>
              <div className="text-sm font-medium flex items-center gap-1">
                <CheckSquare className="h-3.5 w-3.5" />
                {totalSubtasks > 0 ? (
                  <span className={allCompleted ? "text-green-600 dark:text-green-500" : ""}>
                    {completedSubtasks}/{totalSubtasks} {pendingSubtasks > 0 && <span className="text-red-500 dark:text-red-400 text-xs ml-1">({pendingSubtasks} pending)</span>}
                  </span>
                ) : (
                  <span className="text-muted-foreground">0/0</span>
                )}
              </div>
            </div>
          </div>

          {description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-muted/20 p-4 rounded-md border border-border/50">
                {description}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Button 
              variant={isTracking ? "destructive" : "secondary"} 
              onClick={() => setIsTracking(!isTracking)}
            >
              {isTracking ? (
                <><Square className="h-4 w-4 mr-2" /> Stop Timer</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Start Timer</>
              )}
            </Button>
            {onDelete && task && (
              <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(task.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            )}
          </div>
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" /> Edit Task
          </Button>
        </DialogFooter>
      </>
    );
  };

  const renderEditMode = () => {
    return (
      <>
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={handleGenerateSuggestions}
              disabled={isGenerating || !title.trim()}
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI Suggest
            </Button>
          </div>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Select kitchen tiles"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Assignee</Label>
                <Button variant="ghost" size="xs" className="h-5 px-1 text-xs" onClick={() => setIsManageUsersOpen(true)}>
                  Manage
                </Button>
              </div>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger render={
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                } />
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Category (Room)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="timeEstimate">Time Estimate (mins)</Label>
              <Input 
                id="timeEstimate" 
                type="number" 
                min="0"
                value={timeEstimate || ''} 
                onChange={(e) => setTimeEstimate(parseInt(e.target.value) || 0)} 
                placeholder="e.g., 120"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input 
                id="budget" 
                type="number" 
                min="0"
                value={budget || ''} 
                onChange={(e) => setBudget(parseInt(e.target.value) || 0)} 
                placeholder="e.g., 500"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Add more details about this task..."
              className="min-h-[80px]"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Checklist</Label>
            <div className="flex flex-col gap-2">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-2 group">
                  <Checkbox 
                    checked={st.completed} 
                    onCheckedChange={() => toggleSubtask(st.id)} 
                  />
                  <span className={cn("flex-1 text-sm", st.completed && "line-through text-muted-foreground")}>
                    {st.title}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => removeSubtask(st.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  value={newSubtask} 
                  onChange={(e) => setNewSubtask(e.target.value)} 
                  placeholder="Add an item..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                />
                <Button variant="secondary" size="sm" onClick={addSubtask} className="h-8">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2"><Package className="h-4 w-4" /> Materials Tracking</Label>
            <div className="flex flex-col gap-2">
              {materials.map(m => (
                <div key={m.id} className="flex items-center gap-2 group bg-muted/30 p-2 rounded-md border text-sm">
                  <div className="flex-1 font-medium">{m.name}</div>
                  <div className="text-muted-foreground w-1/3 truncate text-xs">{m.vendor}</div>
                  <Badge 
                    variant={m.status === 'delivered' ? 'default' : m.status === 'ordered' ? 'secondary' : 'outline'}
                    className="cursor-pointer text-[10px] uppercase"
                    onClick={() => toggleMaterialStatus(m.id)}
                  >
                    {m.status}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => removeMaterial(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  value={newMaterialName} 
                  onChange={(e) => setNewMaterialName(e.target.value)} 
                  placeholder="Material name..."
                  className="h-8 text-sm flex-1"
                />
                <Input 
                  value={newMaterialVendor} 
                  onChange={(e) => setNewMaterialVendor(e.target.value)} 
                  placeholder="Vendor..."
                  className="h-8 text-sm w-1/3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addMaterial();
                    }
                  }}
                />
                <Button variant="secondary" size="sm" onClick={addMaterial} className="h-8">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Attachments</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-md overflow-hidden border">
                  <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-red-400" onClick={() => removeImage(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Input 
                value={newImageUrl} 
                onChange={(e) => setNewImageUrl(e.target.value)} 
                placeholder="Image URL..."
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <Button variant="secondary" size="sm" onClick={addImage} className="h-8">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {task && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments</Label>
              <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto p-2 border rounded-md bg-muted/10">
                {comments.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No comments yet.</div>
                ) : (
                  comments.map(c => {
                    const author = users.find(u => u.id === c.authorId);
                    return (
                      <div key={c.id} className="flex gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={author?.avatar} />
                          <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 p-2 rounded-md rounded-tl-none">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-xs">{author?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                          </div>
                          <p>{c.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  value={newComment} 
                  onChange={(e) => setNewComment(e.target.value)} 
                  placeholder="Add a comment..."
                  className="h-9 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addComment();
                    }
                  }}
                />
                <Button variant="secondary" size="sm" onClick={addComment} className="h-9">
                  Post
                </Button>
              </div>
            </div>
          )}

          {task && (
            <div className="grid gap-2 p-4 bg-muted/50 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label className="mb-0">Time Tracked</Label>
                </div>
                <div className="font-mono text-lg font-medium tracking-wider">
                  {formatTime(timeSpent)}
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button 
                  variant={isTracking ? "destructive" : "default"} 
                  size="sm" 
                  onClick={() => setIsTracking(!isTracking)}
                  className="w-24"
                >
                  {isTracking ? (
                    <><Square className="h-4 w-4 mr-2" /> Stop</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Start</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            if (!task) onOpenChange(false);
            else setIsEditing(false);
          }}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim()}>Save Task</Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {isEditing ? renderEditMode() : renderViewMode()}
      </DialogContent>
    </Dialog>

    <Dialog open={isManageUsersOpen} onOpenChange={setIsManageUsersOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Manage Assignees</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="New assignee name" 
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newUserName.trim()) {
                  addUser({ name: newUserName.trim(), avatar: `https://i.pravatar.cc/150?u=${Date.now()}`, role: 'Team Member' });
                  setNewUserName('');
                }
              }}
            />
            <Button 
              onClick={() => {
                if (newUserName.trim()) {
                  addUser({ name: newUserName.trim(), avatar: `https://i.pravatar.cc/150?u=${Date.now()}`, role: 'Team Member' });
                  setNewUserName('');
                }
              }}
              disabled={!newUserName.trim()}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                {editingUserId === user.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <Input 
                      value={editingUserName}
                      onChange={(e) => setEditingUserName(e.target.value)}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editingUserName.trim()) {
                          updateUser(user.id, { name: editingUserName.trim() });
                          setEditingUserId(null);
                        } else if (e.key === 'Escape') {
                          setEditingUserId(null);
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-2"
                      onClick={() => {
                        if (editingUserName.trim()) {
                          updateUser(user.id, { name: editingUserName.trim() });
                          setEditingUserId(null);
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name}</span>
                  </div>
                )}
                
                {editingUserId !== user.id && (
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingUserId(user.id);
                        setEditingUserName(user.name);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (assignee === user.id) setAssignee('none');
                        removeUser(user.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
