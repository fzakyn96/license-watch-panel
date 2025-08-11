import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, LogOut, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";

interface DashboardHeaderProps {
  onLogout: () => void;
}

export const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const response = await apiFetch('http://localhost:8080/cron/running');
      const data = await response.json();

      if (data.status === 404) {
        const createResponse = await apiFetch('http://localhost:8080/cron/create', {
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
      const response = await apiFetch('http://localhost:8080/cron/running');
      const data = await response.json();
      if (enabled) {
        const uuid = data.data[0].uuid;
        const switchResponse = await apiFetch('http://localhost:8080/cron/switch', {
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
        const switchResponse = await apiFetch('http://localhost:8080/cron/switch', {
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
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Lisensi Aset</h1>
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
              variant="destructive"
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