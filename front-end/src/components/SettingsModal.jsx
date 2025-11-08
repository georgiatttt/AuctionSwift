import { useState, useEffect } from 'react';
import { User, Bell, Lock, Moon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';

export function SettingsModal({ open, onOpenChange }) {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[70vh]">
          <div className="space-y-6 mt-4">
            {/* Appearance Settings */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <CardTitle className="text-base">Appearance</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Customize how the app looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Dark Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Enable dark theme for better viewing in low light
                    </div>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <CardTitle className="text-base">Profile Information</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first-name" className="text-xs">First Name</Label>
                    <Input id="first-name" placeholder="John" defaultValue="John" className="h-9" />
                  </div>
                  <div>
                    <Label htmlFor="last-name" className="text-xs">Last Name</Label>
                    <Input id="last-name" placeholder="Doe" defaultValue="Doe" className="h-9" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input id="email" type="email" defaultValue="john@example.com" className="h-9" />
                </div>
                <Button size="sm">Save Changes</Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <CardTitle className="text-base">Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Email Notifications</div>
                    <div className="text-xs text-muted-foreground">
                      Receive email updates
                    </div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">New Item Alerts</div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when items are added
                    </div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <CardTitle className="text-base">Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                  <Input id="current-password" type="password" className="h-9" />
                </div>
                <div>
                  <Label htmlFor="new-password" className="text-xs">New Password</Label>
                  <Input id="new-password" type="password" className="h-9" />
                </div>
                <Button size="sm">Update Password</Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
