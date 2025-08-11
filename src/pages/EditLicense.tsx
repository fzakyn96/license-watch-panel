import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { getCookie } from "@/lib/cookies";

interface License {
  uuid: string;
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
  createdAt: string;
  updatedAt: string;
}

export const EditLicense = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<License | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const response = await apiFetch(`http://localhost:8080/licenses/find?uuid=${uuid}`);
        const data = await response.json();

        if (data.status === 200) {
          setFormData(data.data);
        } else {
          throw new Error('Gagal memuat data lisensi');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat memuat data lisensi",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (uuid) {
      fetchLicense();
    }
  }, [uuid]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const requiredFields = ['name', 'start_date', 'end_date', 'volume', 'satuan', 'harga_satuan', 'username', 'password'];

    requiredFields.forEach(field => {
      if (!formData?.[field]) {
        newErrors[field] = 'Field ini wajib diisi';
      }
    });

    if (formData?.volume && formData.volume <= 0) {
      newErrors.volume = 'Volume harus lebih besar dari 0';
    }

    if (formData?.harga_satuan && formData.harga_satuan < 0) {
      newErrors.harga_satuan = 'Harga satuan tidak boleh negatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof License, value: string | number) => {
    if (!formData) return;

    const newFormData = { ...formData, [field]: value };

    // Kalkulasi otomatis total harga
    if (field === 'volume' || field === 'harga_satuan') {
      const volume = field === 'volume' ? Number(value) : formData.volume;
      const hargaSatuan = field === 'harga_satuan' ? Number(value) : formData.harga_satuan;
      newFormData.jumlah = volume * hargaSatuan;
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const username = getCookie('username') || '';
      const updateData = {
        ...formData,
        last_user_input: username,
        updatedAt: new Date().toISOString()
      };

      const response = await apiFetch('http://localhost:8080/licenses/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Data lisensi berhasil diperbarui"
        });
        navigate('/');
      } else {
        throw new Error('Gagal memperbarui data');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memperbarui data lisensi",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  }

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
              Edit Lisensi
            </h2>
            <p className="text-muted-foreground">
              Edit data lisensi yang sudah ada
            </p>
          </div>
        </div>
      </main>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Aset</Label>
                <Input
                  id="name"
                  value={formData?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
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
                          !formData?.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData?.start_date ? format(new Date(formData.start_date), "yyyy-MM-dd") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData?.start_date ? new Date(formData.start_date) : undefined}
                        onSelect={(date) => handleInputChange('start_date', date?.toISOString() || '')}
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
                          "w-full justify-start text-left font-normal",
                          !formData?.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData?.end_date ? format(new Date(formData.end_date), "yyyy-MM-dd") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData?.end_date ? new Date(formData.end_date) : undefined}
                        onSelect={(date) => handleInputChange('end_date', date?.toISOString() || '')}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.end_date && <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    type="number"
                    value={formData?.volume || ''}
                    onChange={(e) => handleInputChange('volume', Number(e.target.value))}
                    aria-invalid={!!errors.volume}
                  />
                  {errors.volume && <p className="text-sm text-red-500 mt-1">{errors.volume}</p>}
                </div>

                <div>
                  <Label htmlFor="satuan">Satuan</Label>
                  <Input
                    id="satuan"
                    value={formData?.satuan || ''}
                    onChange={(e) => handleInputChange('satuan', e.target.value)}
                    aria-invalid={!!errors.satuan}
                  />
                  {errors.satuan && <p className="text-sm text-red-500 mt-1">{errors.satuan}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="harga_satuan">Harga Satuan</Label>
                <Input
                  id="harga_satuan"
                  type="number"
                  value={formData?.harga_satuan || ''}
                  onChange={(e) => handleInputChange('harga_satuan', Number(e.target.value))}
                  aria-invalid={!!errors.harga_satuan}
                />
                {errors.harga_satuan && <p className="text-sm text-red-500 mt-1">{errors.harga_satuan}</p>}
              </div>

              <div>
                <Label htmlFor="jumlah">Total Harga</Label>
                <Input
                  id="jumlah"
                  type="number"
                  value={formData?.jumlah || 0}
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData?.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    aria-invalid={!!errors.username}
                  />
                  {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData?.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="lokasi_lisensi">Lokasi</Label>
                <Input
                  id="lokasi_lisensi"
                  value={formData?.lokasi_lisensi || ''}
                  onChange={(e) => handleInputChange('lokasi_lisensi', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Catatan</Label>
                <Input
                  id="description"
                  value={formData?.description || ''}
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