import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, LogOut, Shield, Mail, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { EmailManagement } from "@/components/email-management";
import { useTheme } from "next-themes";

interface DashboardHeaderProps {
  onLogout: () => void;
}

export const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const response = await apiFetch(`${import.meta.env.VITE_BASE_URL}/cron/running`);
      const data = await response.json();

      if (data.status === 404) {
        const createResponse = await apiFetch(`${import.meta.env.VITE_BASE_URL}/cron/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: "sendEmail",
            time_schedule: "0 9,15 * * 1-5",
            is_running: true
          })
        });

        if (createResponse.ok) {
          setNotificationsEnabled(true);
          toast({
            title: "Notifikasi diaktifkan",
            description: "Anda akan menerima notifikasi untuk lisensi yang akan kadaluarsa"
          });
        }
      }
      if (data.status === 200 && data.data[0].is_running === true) {
        setNotificationsEnabled(true);
      }
      if (data.status === 200 && data.data[0].is_running === false) {
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      const response = await apiFetch(`${import.meta.env.VITE_BASE_URL}/cron/running`);
      const data = await response.json();
      if (enabled) {
        const uuid = data.data[0].uuid;
        const switchResponse = await apiFetch(`${import.meta.env.VITE_BASE_URL}/cron/switch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uuid: uuid,
            is_running: true
          })
        });

        if (switchResponse.ok) {
          setNotificationsEnabled(true);
          toast({
            title: "Notifikasi diaktifkan",
            description: "Anda akan menerima notifikasi untuk lisensi yang akan kadaluarsa"
          });
        }
      } else {
        const uuid = data.data[0].uuid;
        const switchResponse = await apiFetch(`${import.meta.env.VITE_BASE_URL}/cron/switch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uuid: uuid,
            is_running: false
          })
        });

        if (switchResponse.ok) {
          setNotificationsEnabled(false);
          toast({
            title: "Notifikasi dinonaktifkan",
            description: "Notifikasi telah dinonaktifkan"
          });
        }
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengubah status notifikasi",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src={theme === 'dark' ? '/logo-dark.png' : '/logo-white.png'} 
              alt="Lisensi Aset Logo"
              className="h-8 w-auto sm:h-8 object-contain"
            />
            <div className="hidden lg:block">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Lisensi Aset</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Sistem Monitoring Lisensi Aset</p>
            </div>
          </div>

          {/* Navigation items */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Email Management */}
            <EmailManagement>
              <Button
                variant="default"
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Email</span>
              </Button>
            </EmailManagement>

            {/* Notification toggle */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                aria-label="Toggle notifications"
                className="scale-75 sm:scale-100"
              />
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {notificationsEnabled ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-2 sm:px-3 py-1 sm:py-2"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Logout button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onLogout}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};