import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, LogOut, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardHeaderProps {
  onLogout: () => void;
}

export const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { toast } = useToast();

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    toast({
      title: enabled ? "Notifikasi diaktifkan" : "Notifikasi dinonaktifkan",
      description: enabled 
        ? "Anda akan menerima notifikasi untuk lisensi yang akan kadaluarsa" 
        : "Notifikasi telah dinonaktifkan",
    });
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">License Monitor</h1>
              <p className="text-sm text-muted-foreground">Sistem Monitoring Lisensi Aset</p>
            </div>
          </div>

          {/* Navigation items */}
          <div className="flex items-center space-x-6">
            {/* Notification toggle */}
            <div className="flex items-center space-x-3">
              <Bell className={`w-5 h-5 ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                aria-label="Toggle notifications"
              />
              <span className="text-sm text-muted-foreground">
                {notificationsEnabled ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};