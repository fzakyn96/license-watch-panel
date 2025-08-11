import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { getCookie } from "@/lib/cookies";
import { Shield } from "lucide-react";
import { useTheme } from "next-themes";

interface License {
  name: string;
  start_date: string;
  end_date: string;
  volume: number;
  satuan: string;
  harga_satuan: number;
  jumlah: number;
  username: string;
  password: string;
  lokasi_lisensi: string;
  description: string;
  last_user_input: string;
}

const emptyLicense: License = {
  name: "",
  start_date: "",
  end_date: "",
  volume: 0,
  satuan: "",
  harga_satuan: 0,
  jumlah: 0,
  username: "",
  password: "",
  lokasi_lisensi: "",
  description: "",
  last_user_input: ""
};

export const AddLicense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [license, setLicense] = useState<License>(emptyLicense);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const requiredFields = ['name', 'start_date', 'end_date', 'volume', 'satuan', 'harga_satuan', 'username', 'password'];

    requiredFields.forEach(field => {
      if (!license[field]) {
        newErrors[field] = 'Field ini wajib diisi';
      }
    });

    if (license.volume && license.volume <= 0) {
      newErrors.volume = 'Volume harus lebih besar dari 0';
    }

    if (license.harga_satuan && license.harga_satuan < 0) {
      newErrors.harga_satuan = 'Harga satuan tidak boleh negatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof License, value: string | number) => {
    const newLicense = { ...license, [field]: value };

    // Kalkulasi otomatis total harga
    if (field === 'volume' || field === 'harga_satuan') {
      const volume = field === 'volume' ? Number(value) : license.volume;
      const hargaSatuan = field === 'harga_satuan' ? Number(value) : license.harga_satuan;
      newLicense.jumlah = volume * hargaSatuan;
    }

    setLicense(newLicense);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const name = getCookie('auth_name');

      if (!name) {
        toast({
          title: "Error",
          description: "Sesi login tidak valid. Silakan login ulang.",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      const licenseData = {
        name: license.name.trim(),
        start_date: license.start_date ? new Date(license.start_date).toISOString().split('T')[0] : null,
        end_date: license.end_date ? new Date(license.end_date).toISOString().split('T')[0] : null,
        volume: license.volume,
        satuan: license.satuan.trim(),
        harga_satuan: license.harga_satuan,
        username: license.username.trim(),
        password: license.password.trim(),
        lokasi_lisensi: license.lokasi_lisensi?.trim() || null,
        description: license.description?.trim() || null,
        last_user_input: name
      };

      await apiFetch(`${import.meta.env.VITE_BASE_URL}/licenses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(licenseData)
      });

      toast({
        title: "Berhasil",
        description: "Data lisensi berhasil ditambahkan",
        variant: "success"
      });
      navigate('/');
    } catch (error) {
      console.error('Submit Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan data lisensi",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src={theme === 'dark' ? '/logo-dark.png' : '/logo-white.png'}
              alt="Lisensi Aset Logo"
              className="h-8 w-auto sm:h-8 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Lisensi Aset</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Sistem Monitoring Lisensi Aset</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-bold text-foreground">Lisensi Aset</h1>
            </div>
          </div>
            <Button
              variant="default"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Tambah Lisensi
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Tambahkan data lisensi baru
            </p>
          </div>
        </div>
      </main>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Nama Aset - Full width */}
              <div>
                <Label htmlFor="name">Nama Aset</Label>
                <Input
                  id="name"
                  value={license.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  aria-invalid={!!errors.name}
                  className="mt-1"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Tanggal - Stack on mobile, side by side on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal Mulai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !license.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {license.start_date ? format(new Date(license.start_date), "yyyy-MM-dd") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={license.start_date ? new Date(license.start_date) : undefined}
                        onSelect={(date) => {
                          handleInputChange('start_date', date?.toISOString() || '');
                          // Auto close popover after selection
                          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        }}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>}
                </div>

                <div>
                  <Label>Tanggal Berakhir</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !license.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {license.end_date ? format(new Date(license.end_date), "yyyy-MM-dd") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={license.end_date ? new Date(license.end_date) : undefined}
                        onSelect={(date) => {
                          handleInputChange('end_date', date?.toISOString() || '');
                          // Auto close popover after selection
                          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        }}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.end_date && <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>}
                </div>
              </div>

              {/* Volume & Satuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    type="number"
                    value={license.volume}
                    onChange={(e) => handleInputChange('volume', Number(e.target.value))}
                    aria-invalid={!!errors.volume}
                    className="mt-1"
                  />
                  {errors.volume && <p className="text-sm text-red-500 mt-1">{errors.volume}</p>}
                </div>

                <div>
                  <Label htmlFor="satuan">Satuan</Label>
                  <Input
                    id="satuan"
                    value={license.satuan}
                    onChange={(e) => handleInputChange('satuan', e.target.value)}
                    aria-invalid={!!errors.satuan}
                    className="mt-1"
                  />
                  {errors.satuan && <p className="text-sm text-red-500 mt-1">{errors.satuan}</p>}
                </div>
              </div>

              {/* Harga Satuan & Total Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="harga_satuan">Harga Satuan</Label>
                  <Input
                    id="harga_satuan"
                    type="number"
                    value={license.harga_satuan}
                    onChange={(e) => handleInputChange('harga_satuan', Number(e.target.value))}
                    aria-invalid={!!errors.harga_satuan}
                    className="mt-1"
                  />
                  {errors.harga_satuan && <p className="text-sm text-red-500 mt-1">{errors.harga_satuan}</p>}
                </div>

                <div>
                  <Label htmlFor="jumlah">Total Harga</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    value={license.jumlah || 0}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={license.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    aria-invalid={!!errors.username}
                    className="mt-1"
                  />
                  {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={license.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    aria-invalid={!!errors.password}
                    className="mt-1"
                  />
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <Label htmlFor="lokasi_lisensi">Lokasi</Label>
                <Input
                  id="lokasi_lisensi"
                  value={license.lokasi_lisensi}
                  onChange={(e) => handleInputChange('lokasi_lisensi', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Catatan */}
              <div>
                <Label htmlFor="description">Catatan</Label>
                <Textarea
                  id="description"
                  value={license.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="Masukkan catatan atau keterangan tambahan..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Batal
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};