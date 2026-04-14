import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Settings } from '../types';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, updateSettings }: SettingsDialogProps) {

  const handleThemeChange = (theme: Settings['theme']) => {
    updateSettings({ theme });
  };

  const handleMeasurementUnitChange = (measurementUnit: Settings['measurementUnit']) => {
    updateSettings({ measurementUnit });
  };

  const handleReminderTimingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      updateSettings({ reminderTiming: val });
    }
  };

  const isValidWhatsAppNumber = (number: string | undefined) => {
    if (!number) return false;
    return /^\+\d{5,15}$/.test(number.replace(/[\s-]/g, ''));
  };

  const handleTestWhatsApp = () => {
    const cleanNumber = settings.whatsappNumber?.replace(/[\s-]/g, '') || '';
    if (!isValidWhatsAppNumber(cleanNumber)) return;

    const message = "Hello! This is a test message from TaskFlow.";
    const encodedMessage = encodeURIComponent(message);
    const phoneForLink = cleanNumber.replace('+', '');
    const url = `https://wa.me/${phoneForLink}?text=${encodedMessage}`;

    window.open(url, '_blank');
    updateSettings({ lastWhatsAppSent: new Date().toISOString() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      
      {/* ✅ FIXED DIALOG */}
      <DialogContent className="
        z-[100] 
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
          <div className="grid gap-2">
            <Label>Theme</Label>
            <Select value={settings.theme} onValueChange={handleThemeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Measurement */}
          <div className="grid gap-2">
            <Label>Measurement Unit</Label>
            <Select value={settings.measurementUnit} onValueChange={handleMeasurementUnitChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="feet">Feet</SelectItem>
                <SelectItem value="inches">Inches</SelectItem>
                <SelectItem value="meters">Meters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reminder */}
          <div className="grid gap-2">
            <Label>Reminder Timing (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={settings.reminderTiming}
              onChange={handleReminderTimingChange}
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <Label>Enable Notifications</Label>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) =>
                updateSettings({ notificationsEnabled: checked })
              }
            />
          </div>

          {/* WhatsApp */}
          <div className="flex items-center justify-between">
            <Label>WhatsApp Alerts</Label>
            <Switch
              checked={settings.whatsappEnabled || false}
              onCheckedChange={(checked) =>
                updateSettings({ whatsappEnabled: checked })
              }
            />
          </div>

          {/* WhatsApp Number */}
          {settings.whatsappEnabled && (
            <div className="grid gap-2">
              <Label>WhatsApp Number</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="+91XXXXXXXXXX"
                  value={settings.whatsappNumber || ''}
                  onChange={(e) =>
                    updateSettings({ whatsappNumber: e.target.value })
                  }
                />
                <Button
                  variant="secondary"
                  onClick={handleTestWhatsApp}
                  disabled={!isValidWhatsAppNumber(settings.whatsappNumber)}
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
                value={settings.workingHours.start}
                onChange={(e) =>
                  updateSettings({
                    workingHours: {
                      ...settings.workingHours,
                      start: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <Label>End</Label>
              <Input
                type="time"
                value={settings.workingHours.end}
                onChange={(e) =>
                  updateSettings({
                    workingHours: {
                      ...settings.workingHours,
                      end: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}