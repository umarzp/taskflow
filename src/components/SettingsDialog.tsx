import React, { useState } from 'react';
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
    // Must start with + and contain only digits after that
    return /^\+\d{5,15}$/.test(number.replace(/[\s-]/g, ''));
  };

  const handleTestWhatsApp = () => {
    const cleanNumber = settings.whatsappNumber?.replace(/[\s-]/g, '') || '';
    if (!isValidWhatsAppNumber(cleanNumber)) return;
    
    const message = "Hello! This is a test message from TaskFlow.";
    const encodedMessage = encodeURIComponent(message);
    // Remove the + for the wa.me link
    const phoneForLink = cleanNumber.replace('+', '');
    const url = `https://wa.me/${phoneForLink}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
    alert('Test message link opened successfully!');
    updateSettings({ lastWhatsAppSent: new Date().toISOString() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <Select value={settings.theme} onValueChange={handleThemeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Measurement Unit</Label>
            <Select value={settings.measurementUnit} onValueChange={handleMeasurementUnitChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feet">Feet (ft)</SelectItem>
                <SelectItem value="inches">Inches (in)</SelectItem>
                <SelectItem value="meters">Meters (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reminderTiming">Default Reminder Timing (minutes before)</Label>
            <Input 
              id="reminderTiming" 
              type="number" 
              min="0"
              value={settings.reminderTiming} 
              onChange={handleReminderTimingChange} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts for deadlines and updates.
              </p>
            </div>
            <Switch 
              checked={settings.notificationsEnabled} 
              onCheckedChange={(checked) => updateSettings({ notificationsEnabled: checked })} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable WhatsApp Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive task reminders on WhatsApp.
              </p>
            </div>
            <Switch 
              checked={settings.whatsappEnabled || false} 
              onCheckedChange={(checked) => updateSettings({ whatsappEnabled: checked })} 
            />
          </div>

          {settings.whatsappEnabled && (
            <div className="grid gap-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number (with country code)</Label>
              <div className="flex gap-2">
                <Input 
                  id="whatsappNumber" 
                  placeholder="e.g., +1234567890"
                  value={settings.whatsappNumber || ''} 
                  onChange={(e) => updateSettings({ whatsappNumber: e.target.value })} 
                />
                <Button 
                  variant="secondary" 
                  onClick={handleTestWhatsApp}
                  disabled={!isValidWhatsAppNumber(settings.whatsappNumber)}
                >
                  Test
                </Button>
              </div>
              {settings.lastWhatsAppSent && (
                <p className="text-xs text-muted-foreground">
                  Last message sent: {new Date(settings.lastWhatsAppSent).toLocaleString()}
                </p>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="workStart">Working Hours Start</Label>
              <Input 
                id="workStart" 
                type="time" 
                value={settings.workingHours.start} 
                onChange={(e) => updateSettings({ workingHours: { ...settings.workingHours, start: e.target.value } })} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workEnd">Working Hours End</Label>
              <Input 
                id="workEnd" 
                type="time" 
                value={settings.workingHours.end} 
                onChange={(e) => updateSettings({ workingHours: { ...settings.workingHours, end: e.target.value } })} 
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
