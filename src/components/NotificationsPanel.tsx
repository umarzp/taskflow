import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Bell, CheckCircle2, Clock, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface NotificationsPanelProps {
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  clearNotification: (id: string) => void;
}

export function NotificationsPanel({ notifications, markNotificationRead, clearNotification }: NotificationsPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'priority': return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
          )}
        </Button>
      } />
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "flex gap-3 p-3 border-b last:border-0 hover:bg-muted/50 transition-colors relative group",
                    !notification.read && "bg-muted/20"
                  )}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm font-medium leading-none", !notification.read && "text-foreground")}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {!notification.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
