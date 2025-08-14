import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";

interface NotificationScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const NotificationScheduleDialog = ({ open, onOpenChange, onSuccess }: NotificationScheduleDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);
  const [hasExistingData, setHasExistingData] = useState(false);

  // Form state
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>(['09:00']);

  const { toast } = useToast();

  const daysOfWeek = [
    { value: '1', label: 'Senin' },
    { value: '2', label: 'Selasa' },
    { value: '3', label: 'Rabu' },
    { value: '4', label: 'Kamis' },
    { value: '5', label: 'Jumat' },
    { value: '6', label: 'Sabtu' },
    { value: '0', label: 'Minggu' }
  ];

  useEffect(() => {
    if (open) {
      checkExistingSchedule();
    }
  }, [open]);

  const checkExistingSchedule = async () => {
    try {
      const response = await apiFetch(`${import.meta.env.VITE_BASE_URL}/cron/running`);
      const data = await response.json();

      if (data.status === 200 && data.data && data.data.length > 0) {
        setExistingData(data.data[0]);
        setHasExistingData(true);
        parseCronSchedule(data.data[0].time_schedule);
      } else {
        setHasExistingData(false);
        // Set default values
        setSelectedDays(['1', '2', '3', '4', '5']); // Monday to Friday
        setTimes(['09:00', '15:00']);
      }
    } catch (error) {
      console.error('Error checking existing schedule:', error);
      setHasExistingData(false);
      setSelectedDays(['1', '2', '3', '4', '5']);
      setTimes(['09:00', '15:00']);
    }
  };

  const parseCronSchedule = (cronExpression: string) => {
    // Parse cron expression: "0 9,15 * * 1-5"
    // Format: minute hour day month dayOfWeek
    const parts = cronExpression.split(' ');
    if (parts.length === 5) {
      const [minute, hour, , , dayOfWeek] = parts;

      // Parse hours
      const hourParts = hour.split(',');
      const parsedTimes = hourParts.map(h => `${h.padStart(2, '0')}:${minute.padStart(2, '0')}`);
      setTimes(parsedTimes);

      // Parse days
      if (dayOfWeek.includes('-')) {
        const [start, end] = dayOfWeek.split('-').map(Number);
        const days = [];
        for (let i = start; i <= end; i++) {
          days.push(i.toString());
        }
        setSelectedDays(days);
      } else if (dayOfWeek.includes(',')) {
        setSelectedDays(dayOfWeek.split(','));
      } else {
        setSelectedDays([dayOfWeek]);
      }
    }
  };

  const convertToCron = () => {
    // Extract unique hours and minutes
    const timeHours = [...new Set(times.map(time => time.split(':')[0]))];
    const minutes = times[0]?.split(':')[1] || '00';

    // Create cron expression
    const hourExpression = timeHours.join(',');
    const dayExpression = selectedDays.sort((a, b) => Number(a) - Number(b)).join(',');

    return `${minutes} ${hourExpression} * * ${dayExpression}`;
  };

  const handleSave = async () => {
    if (selectedDays.length === 0 || times.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal satu hari dan satu waktu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const cronExpression = convertToCron();

      const response = await apiFetch(`${import.meta.env.VITE_BASE_URL}/cron/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: "sendEmail",
          time_schedule: cronExpression,
          is_running: true
        })
      });

      if (response.ok) {
        toast({
          title: "Notifikasi berhasil disimpan dan diaktifkan",
          description: "Notifikasi telah dijadwalkan sesuai pengaturan",
          variant: "success"
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan penjadwalan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (selectedDays.length === 0 || times.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal satu hari dan satu waktu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const cronExpression = convertToCron();

      const response = await apiFetch(`${import.meta.env.VITE_BASE_URL}/cron/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: existingData.uuid,
          time_schedule: cronExpression,
          is_running: true
        })
      });

      if (response.ok) {
        toast({
          title: "Notifikasi berhasil diperbarui dan diaktifkan",
          description: "Notifikasi telah dijadwalkan ulang sesuai pengaturan",
          variant: "success"
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui penjadwalan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTime = () => {
    setTimes([...times, '09:00']);
  };

  const removeTime = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Pengaturan Penjadwalan Notifikasi
          </DialogTitle>
          <DialogDescription className="text-left">
            Atur hari dan waktu untuk pengiriman notifikasi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Days Selection */}
          <div>
            <Label className="text-sm font-medium">Hari</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {daysOfWeek.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={selectedDays.includes(day.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day.value)}
                  className="text-xs"
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Times Selection */}
          <div>
            <Label className="text-sm font-medium">Waktu</Label>
            <div className="space-y-2 mt-2">
              {times.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => updateTime(index, e.target.value)}
                    className="flex-1"
                  />
                  {times.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTime(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="warning"
                size="sm"
                onClick={addTime}
                className="w-full"
              >
                <Plus className="w-4 h-4" />
                Tambah Waktu
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Batal
            </Button>

            {hasExistingData ? (
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Memperbarui..." : "Perbarui & Aktifkan"}
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Menyimpan..." : "Simpan & Aktifkan"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};