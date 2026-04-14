import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Settings } from '../types';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, updateSettings }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    onOpenChange(false);
  };

  const handleThemeChange = (theme: Settings['theme']) => {
    setLocalSettings(prev => ({ ...prev, theme }));
  };

  const handleMeasurementUnitChange = (measurementUnit: Settings['measurementUnit']) => {
    setLocalSettings(prev => ({ ...prev, measurementUnit }));
  };

  const handleReminderTimingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setLocalSettings(prev => ({ ...prev, reminderTiming: val }));
    }
  };

  const isValidWhatsAppNumber = (number: string | undefined) => {
    if (!number) return false;
    return /^\+\d{5,15}$/.test(number.replace(/[\s-]/g, ''));
  };

  const handleTestWhatsApp = () => {
    const cleanNumber = localSettings.whatsappNumber?.replace(/[\s-]/g, '') || '';
    if (!isValidWhatsAppNumber(cleanNumber)) return;

    const message = "Hello! This is a test message from TaskFlow.";
    const encodedMessage = encodeURIComponent(message);
    const phoneForLink = cleanNumber.replace('+', '');
    const url = `https://wa.me/${phoneForLink}?text=${encodedMessage}`;

    window.open(url, '_blank');
    setLocalSettings(prev => ({ ...prev, lastWhatsAppSent: new Date().toISOString() }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      
      {/* ✅ FIXED DIALOG */}
      <DialogContent className="
        fixed 
        top-[50%] left-[50%] 
        translate-x-[-50%] translate-y-[-50%]
        w-[95vw] sm:max-w-[500px]
        max-h-[90vh] 
        overflow-y-auto
        rounded-xl
      ">
        
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">

          {/* Theme */}
          <div className="grid gap-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-muted/50",
                  localSettings.theme === 'light' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                )}
              >
                <div className="relative">
                  <Sun className="h-6 w-6" />
                  {localSettings.theme === 'light' && (
                    <div className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-muted/50",
                  localSettings.theme === 'dark' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                )}
              >
                <div className="relative">
                  <Moon className="h-6 w-6" />
                  {localSettings.theme === 'dark' && (
                    <div className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-muted/50",
                  localSettings.theme === 'system' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                )}
              >
                <div className="relative">
                  <Monitor className="h-6 w-6" />
                  {localSettings.theme === 'system' && (
                    <div className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">System</span>
              </button>
            </div>
          </div>

          {/* Measurement */}
          <div className="grid gap-3">
            <Label>Measurement Unit</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleMeasurementUnitChange('feet')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all hover:bg-muted/50",
                  localSettings.measurementUnit === 'feet' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                )}
              >
                <span className="text-sm font-medium">Feet</span>
              </button>

              <button
                type="button"
                onClick={() => handleMeasurementUnitChange('inches')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all hover:bg-muted/50",
                  localSettings.measurementUnit === 'inches' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                )}
              >
                <span className="text-sm font-medium">Inches</span>
              </button>

              <button
                type="button"
                onClick={() => handleMeasurementUnitChange('meters')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all hover:bg-muted/50",
                  localSettings.measurementUnit === 'meters' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                )}
              >
                <span className="text-sm font-medium">Meters</span>
              </button>
            </div>
          </div>

          {/* Reminder */}
          <div className="grid gap-2">
            <Label>Reminder Timing (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={localSettings.reminderTiming}
              onChange={handleReminderTimingChange}
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <Label>Enable Notifications</Label>
            <Switch
              checked={localSettings.notificationsEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings(prev => ({ ...prev, notificationsEnabled: checked }))
              }
            />
          </div>

          {/* WhatsApp */}
          <div className="flex items-center justify-between">
            <Label>WhatsApp Alerts</Label>
            <Switch
              checked={localSettings.whatsappEnabled || false}
              onCheckedChange={(checked) =>
                setLocalSettings(prev => ({ ...prev, whatsappEnabled: checked }))
              }
            />
          </div>

          {/* WhatsApp Number */}
          {localSettings.whatsappEnabled && (
            <div className="grid gap-2">
              <Label>WhatsApp Number</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="+91XXXXXXXXXX"
                  value={localSettings.whatsappNumber || ''}
                  onChange={(e) =>
                    setLocalSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))
                  }
                />
                <Button
                  variant="secondary"
                  onClick={handleTestWhatsApp}
                  disabled={!isValidWhatsAppNumber(localSettings.whatsappNumber)}
                >
                  Test
                </Button>
              </div>
            </div>
          )}

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start</Label>
              <Input
                type="time"
                value={localSettings.workingHours.start}
                onChange={(e) =>
                  setLocalSettings(prev => ({
                    ...prev,
                    workingHours: {
                      ...prev.workingHours,
                      start: e.target.value,
                    },
                  }))
                }
              />
            </div>

            <div>
              <Label>End</Label>
              <Input
                type="time"
                value={localSettings.workingHours.end}
                onChange={(e) =>
                  setLocalSettings(prev => ({
                    ...prev,
                    workingHours: {
                      ...prev.workingHours,
                      end: e.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>

        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}