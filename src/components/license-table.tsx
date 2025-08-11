import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { getCookie } from "@/lib/cookies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { range } from "lodash";
import {
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  PlusIcon,
  MoreVertical,
  DollarSign
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

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

interface ApiResponse {
  status: number;
  response: string;
  data: {
    docs: License[];
    pages: number;
    total: number;
  };
}

interface LicenseTableProps {
  onDataChange?: () => void;
}

export const LicenseTable = ({ onDataChange }: LicenseTableProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const fetchLicenses = async (page: number, paginate: number, searchQuery?: string) => {
    try {
      setIsLoading(true);
      let url = `http://localhost:8080/licenses/get?page=${page}&paginate=${paginate}&name=`;
      if (searchQuery) {
        url += `${encodeURIComponent(searchQuery)}`;
      }

      const response = await apiFetch(url);
      const data: ApiResponse = await response.json();

      if (data.status === 200) {
        setLicenses(data.data.docs);
        setTotalPages(data.data.pages);
      } else {
        throw new Error('Gagal memuat data lisensi');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data lisensi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses(currentPage, parseInt(itemsPerPage));
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLicenses(1, parseInt(itemsPerPage), searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getLicenseStatus = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return {
      text: 'Sudah Kadaluarsa',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle
    };
    if (diffDays <= 120) return {
      text: 'Akan Kadaluarsa',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: AlertCircle
    };
    return {
      text: 'Aman',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle2
    };
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPassword(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data without pagination for export
      const response = await apiFetch('http://localhost:8080/license/get?name=');
      const data = await response.json();
      
      if (data.status !== 200) {
        throw new Error('Gagal mengambil data untuk export');
      }
      
      const allLicenses = data.data || [];
      
      const exportData = allLicenses.map((license: License) => ({
        'Nama Aset': license.name,
        'Tanggal Mulai': formatDate(license.start_date),
        'Tanggal Berakhir': formatDate(license.end_date),
        'Status': getLicenseStatus(license.end_date).text,
        'Volume': license.volume,
        'Satuan': license.satuan,
        'Harga Satuan': license.harga_satuan,
        'Total Harga': license.jumlah,
        'Username': license.username,
        'Password': license.password,
        'Lokasi': license.lokasi_lisensi,
        'Catatan': license.description,
        'Pengguna Terakhir': license.last_user_input
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Lisensi');

      // Mengatur lebar kolom
      const colWidths = [
        { wch: 30 }, // Nama Aset
        { wch: 15 }, // Tanggal Mulai
        { wch: 15 }, // Tanggal Berakhir
        { wch: 15 }, // Status
        { wch: 10 }, // Volume
        { wch: 10 }, // Satuan
        { wch: 15 }, // Harga Satuan
        { wch: 15 }, // Total Harga
        { wch: 20 }, // Username
        { wch: 20 }, // Password
        { wch: 30 }, // Lokasi
        { wch: 40 }, // Catatan
        { wch: 20 }  // Pengguna Terakhir
      ];
      ws['!cols'] = colWidths;

      // Mengatur style header
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EFEFEF" } },
          alignment: { horizontal: 'center' }
        };
      }

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      XLSX.writeFile(wb, `Data_Lisensi_${dateStr}.xlsx`);

      toast({
        title: "Export berhasil",
        description: "Data lisensi telah diekspor ke file Excel",
      });
    } catch (error) {
      toast({
        title: "Export gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleDownloadTemplate = () => {
    window.open('/Template_Upload_Data_Lisensi.xlsx', '_blank');
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const handleAction = (action: string, license: License) => {
    if (action === "Delete") {
      setSelectedLicense(license);
      setIsDeleteDialogOpen(true);
    } else if (action === "Edit") {
      navigate(`/edit/${license.uuid}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedLicense) return;

    try {
      const response = await apiFetch(`http://localhost:8080/licenses/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid: selectedLicense.uuid })
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Data lisensi berhasil dihapus"
        });
        setIsDeleteDialogOpen(false);
        fetchLicenses(currentPage, parseInt(itemsPerPage));
      } else {
        throw new Error('Gagal menghapus data');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus data lisensi",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Pilih file terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const username = getCookie('auth_name') || '';
      formData.append('last_user_input', username);

      const response = await apiFetch('http://localhost:8080/licenses/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        navigate('/');
        toast({
          title: "Import berhasil",
          description: "Data lisensi telah berhasil diimport"
        });
        setIsImportDialogOpen(false);
        setSelectedFile(null);
        fetchLicenses(currentPage, parseInt(itemsPerPage));
        onDataChange?.();
      } else {
        throw new Error('Import gagal');
      }
    } catch (error) {
      toast({
        title: "Import gagal",
        description: "Terjadi kesalahan saat mengimport data",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSort = (field: string) => {
    const newOrder = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);

    const sortedLicenses = [...licenses].sort((a, b) => {
      if (field === "volume" || field === "harga_satuan" || field === "jumlah") {
        return sortOrder === "asc"
          ? Number(a[field]) - Number(b[field])
          : Number(b[field]) - Number(a[field]);
      }

      if (field === "start_date" || field === "end_date") {
        return sortOrder === "asc"
          ? new Date(a[field]).getTime() - new Date(b[field]).getTime()
          : new Date(b[field]).getTime() - new Date(a[field]).getTime();
      }

      return sortOrder === "asc"
        ? String(a[field]).localeCompare(String(b[field]))
        : String(b[field]).localeCompare(String(a[field]));
    });

    setLicenses(sortedLicenses);
  };

  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});

  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getPageNumbers = (current: number, total: number) => {
    const maxPages = 5; // Show up to 5 page buttons
    let startPage = Math.max(1, current - Math.floor(maxPages / 2));
    let endPage = Math.min(total, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    return range(startPage, endPage + 1);
  };

  return (
    <div className="space-y-4">
      {/* Title with Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Daftar Lisensi Aset
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => navigate('/add')}
            className="flex items-center justify-center gap-2"
            variant="success"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Lisensi
          </Button>
          <Button
            onClick={() => navigate('/prices')}
            variant="warning"
            className="flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Harga Lisensi
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="flex items-center justify-center gap-2">
                <MoreVertical className="w-4 h-4" />
                Excel
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari lisensi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Import Data Lisensi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>
                Template Excel
              </Label>
              <div className="text-sm text-muted-foreground">
                Gunakan template yang telah disediakan untuk mengimport data
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="text-sm text-muted-foreground">
                Pilih file Excel yang akan diimport
              </div>
              <div className="grid gap-2">
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                 </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menghapus lisensi "{selectedLicense?.name}"?</p>
            <p className="text-sm text-muted-foreground mt-1">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="[&_tr>*]:border-r [&_tr>*:last-child]:border-r-0 [&_tr]:border-b [&_tr:last-child]:border-b-0">
          <TableHeader>
            <TableRow className="bg-muted/50 border-b">
              <TableHead className="w-[120px] text-center whitespace-nowrap">Aksi</TableHead>
              <TableHead
                className="w-[200px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("name")}
              >
                Nama Aset {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("start_date")}
              >
                Tanggal Mulai {sortField === "start_date" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("end_date")}
              >
                Tanggal Berakhir {sortField === "end_date" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("end_date")}
              >
                Status {sortField === "end_date" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="w-[80px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("volume")}
              >
                Volume {sortField === "volume" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="w-[100px] whitespace-nowrap">Satuan</TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("harga_satuan")}
              >
                Harga Satuan {sortField === "harga_satuan" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("jumlah")}
              >
                Total Harga {sortField === "jumlah" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-b-0">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : licenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Tidak ada data lisensi yang ditemukan
                </TableCell>
              </TableRow>
            ) : (
              licenses.map((license, index) => {
                const status = getLicenseStatus(license.end_date);
                return (
                  <>
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => toggleRow(index)}
                          >
                            {expandedRows[index] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleAction("Edit", license)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleAction("Delete", license)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{license.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(license.start_date)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(license.end_date)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {(() => {
                          const status = getLicenseStatus(license.end_date);
                          const StatusIcon = status.icon;
                          return (
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                              <StatusIcon className="w-4 h-4 mr-1" />
                              {status.text}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">{license.volume}</TableCell>
                      <TableCell>{license.satuan}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(license.harga_satuan)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(license.jumlah)}</TableCell>
                    </TableRow>
                    {expandedRows[index] && (
                      <TableRow className="bg-muted/5">
                        <TableCell colSpan={9} className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Informasi Akses</h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium">Username:</span> {license.username}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Password:</span>
                                  <span className="font-mono">
                                    {showPassword[index] ? license.password : '•'.repeat(8)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePasswordVisibility(index)}
                                    className="h-6 w-6 p-0"
                                  >
                                    {showPassword[index] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                <div>
                                  <span className="font-medium">Lokasi:</span> {license.lokasi_lisensi}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Informasi Tambahan</h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium">Catatan:</span>
                                  <p className="mt-1">{license.description}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Pengguna Terakhir:</span> {license.last_user_input}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && licenses.length > 0 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {getPageNumbers(currentPage, totalPages).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
