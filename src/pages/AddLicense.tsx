import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface License {
  name: string;
  start_date: string;
  end_date: string;
  volume: number;
  satuan: string;
  harga_satuan: number;
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
  username: "",
  password: "",
  lokasi_lisensi: "",
  description: "",
  last_user_input: ""
};

export const AddLicense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [license, setLicense] = useState<License>(emptyLicense);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!license.name) newErrors.push("Nama Aset wajib diisi");
    if (!license.start_date) newErrors.push("Tanggal Mulai wajib diisi");
    if (!license.end_date) newErrors.push("Tanggal Berakhir wajib diisi");
    if (!license.volume || license.volume <= 0) newErrors.push("Volume harus lebih besar dari 0");
    if (!license.satuan) newErrors.push("Satuan wajib diisi");
    if (!license.harga_satuan || license.harga_satuan < 0) newErrors.push("Harga Satuan tidak boleh negatif");
    if (!license.username) newErrors.push("Username wajib diisi");
    if (!license.password) newErrors.push("Password wajib diisi");
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleInputChange = (field: keyof License, value: string | number) => {
    setLicense(prev => ({
      ...prev,
      [field]: value
    }));
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

      await apiFetch('http://localhost:8080/licenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(licenseData)
      });

      toast({
        title: "Berhasil",
        description: "Data lisensi berhasil ditambahkan"
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
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Lisensi Aset</h1>
              <p className="text-sm text-muted-foreground">Sistem Monitoring Lisensi Aset</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Tambah Lisensi
            </h2>
            <p className="text-muted-foreground">
              Tambahkan data lisensi baru
            </p>
          </div>
        </div>
      </main>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            {errors.length > 0 && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Aset</Label>
                <Input
                  id="name"
                  value={license.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal Mulai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
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
                        onSelect={(date) => handleInputChange('start_date', date?.toISOString() || '')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Tanggal Berakhir</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
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
                        onSelect={(date) => handleInputChange('end_date', date?.toISOString() || '')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    type="number"
                    value={license.volume}
                    onChange={(e) => handleInputChange('volume', Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="satuan">Satuan</Label>
                  <Input
                    id="satuan"
                    value={license.satuan}
                    onChange={(e) => handleInputChange('satuan', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="harga_satuan">Harga Satuan</Label>
                <Input
                  id="harga_satuan"
                  type="number"
                  value={license.harga_satuan}
                  onChange={(e) => handleInputChange('harga_satuan', Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Userame</Label>
                  <Input
                    id="username"
                    value={license.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={license.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lokasi_lisensi">Lokasi</Label>
                <Input
                  id="lokasi_lisensi"
                  value={license.lokasi_lisensi}
                  onChange={(e) => handleInputChange('lokasi_lisensi', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Catatan</Label>
                <Input
                  id="description"
                  value={license.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate('/')}
            >
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
};