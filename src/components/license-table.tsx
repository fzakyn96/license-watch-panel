import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "@/lib/config";

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
  status_lisensi: number;
  createdAt: string;
  updatedAt: string;
  history_licenses: HistoryLicense[];
}

interface HistoryLicense {
  id: number;
  uuid: string;
  licenses_uuid: string;
  harga_satuan: number;
  tanggal: string;
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
  const [totalItems, setTotalItems] = useState<number>(0);

  const [sortField, setSortField] = useState<string>("status_lisensi");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historySortField, setHistorySortField] = useState<string>("");
  const [historySortDirection, setHistorySortDirection] = useState<"asc" | "desc">("asc");
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(5);

  const fetchLicenses = async (page: number = 1, paginate: number = 10, searchQuery?: string, sort?: string, order?: string) => {
    try {
      // Gunakan endpoint pagination dengan dynamic sorting
      let url = `${BASE_URL}/licenses/get?page=${page}&paginate=${paginate}&name=${searchQuery ? encodeURIComponent(searchQuery) : ''}`;

      // Tambahkan parameter sorting (backend expect default sortField dan sortOrder)
      const sortFieldParam = sort || "status_lisensi";
      const sortOrderParam = (order || "asc").toUpperCase();
      url += `&sortField=${sortFieldParam}&sortOrder=${sortOrderParam}`;

      const response = await apiFetch(url);
      const data: ApiResponse = await response.json();

      if (data.status === 200) {
        setLicenses(data.data.docs);
        setTotalPages(data.data.pages);
        setTotalItems(data.data.total);
        return data.data.docs;
      }
      return [];
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data lisensi",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchData = useCallback(async (searchQuery?: string) => {
    setIsLoading(true);

    try {
      await fetchLicenses(currentPage, parseInt(itemsPerPage), searchQuery, sortField, sortOrder);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, sortField, sortOrder]);

  useEffect(() => {
    if (searchTerm) {
      const delayDebounce = setTimeout(() => {
        fetchData(searchTerm);
        setCurrentPage(1);
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage, searchTerm, sortField, sortOrder]);

  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getLicenseStatus = (status_lisensi: number) => {
    switch (status_lisensi) {
      case 1:
        return {
          text: 'Sudah Kadaluarsa',
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: XCircle
        };
      case 2:
        return {
          text: 'Akan Kadaluarsa',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: AlertCircle
        };
      case 3:
        return {
          text: 'Aman',
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle2
        };
      default:
        return {
          text: 'Unknown',
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: AlertCircle
        };
    }
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

      // Fetch semua data untuk export dengan paginate besar
      const url = `${BASE_URL}/licenses/get?page=1&paginate=9999&name=`;
      const response = await apiFetch(url);
      const data: ApiResponse = await response.json();

      if (data.status !== 200 || data.data.docs.length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada data yang bisa diekspor (data kosong)",
          variant: "warning"
        });
        return;
      }

      const dataToExport = data.data.docs;

      const exportData = dataToExport.map((license: License, index: number) => ({
        'No': index + 1,
        // 'UUID': license.uuid,
        'Nama Aset': license.name,
        'Tanggal Mulai': formatDate(license.start_date),
        'Tanggal Berakhir': formatDate(license.end_date),
        'Status': getLicenseStatus(license.status_lisensi).text,
        'Volume': license.volume,
        'Satuan': license.satuan,
        'Harga Satuan': license.harga_satuan,
        'Total Harga': license.jumlah,
        // 'Username': license.username,
        // 'Password': license.password,
        'Lokasi': license.lokasi_lisensi,
        'Catatan': license.description,
        'Tanggal Dibuat': formatDate(license.createdAt),
        'Tanggal Update': formatDate(license.updatedAt)
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Lisensi');

      // Mengatur lebar kolom
      const colWidths = [
        { wch: 5 }, // No
        { wch: 60 }, // Nama Aset
        { wch: 15 }, // Tanggal Mulai
        { wch: 15 }, // Tanggal Berakhir
        { wch: 15 }, // Status
        { wch: 10 }, // Volume
        { wch: 10 }, // Satuan
        { wch: 15 }, // Harga Satuan
        { wch: 15 }, // Total Harga
        // { wch: 20 }, // Username
        // { wch: 20 }, // Password
        { wch: 30 }, // Lokasi
        { wch: 40 }, // Catatan
        { wch: 20 }, // Tanggal Dibuat
        { wch: 20 }  // Tanggal Update
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
        variant: "success"
      });
    } catch (error) {
      return;
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
    window.open('/lisa/Template_Upload_Data_Lisensi.xlsx', '_blank');
  };

  const [isPriceHistoryDialogOpen, setIsPriceHistoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const handleAction = (action: string, license: License) => {
    if (action === "Delete") {
      setSelectedLicense(license);
      setIsDeleteDialogOpen(true);
    } else if (action === "Edit") {
      navigate(`/edit/${license.uuid}`);
    } else if (action === "History") {
      setSelectedLicense(license);
      setIsPriceHistoryDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedLicense) return;

    try {
      const response = await apiFetch(`${BASE_URL}/licenses/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid: selectedLicense.uuid })
      });

      if (response.ok) {
        navigate('/');
        toast({
          title: "Berhasil",
          description: "Data lisensi berhasil dihapus",
          variant: "success"
        });
        setIsDeleteDialogOpen(false);
        fetchData(searchTerm);
        onDataChange?.();
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

      const response = await apiFetch(`${BASE_URL}/licenses/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        navigate('/');
        toast({
          title: "Import berhasil",
          description: "Data lisensi telah berhasil diimport",
          variant: "success"
        });
        setIsImportDialogOpen(false);
        setSelectedFile(null);
        fetchData(searchTerm);
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

  const handleSort = useCallback((field: string) => {
    setCurrentPage(1); // Reset ke halaman pertama saat sorting

    if (sortField === field) {
      // Toggle order jika field sama
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Set field baru dengan order asc
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField]);

  const getSortIcon = useMemo(() => (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortOrder === "asc" ?
      <ArrowUp className="w-4 h-4 ml-1" /> :
      <ArrowDown className="w-4 h-4 ml-1" />;
  }, [sortField, sortOrder]);

  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});

  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getPageNumbers = (current: number, total: number) => {
    const pages = [];
    const delta = 2;

    pages.push(1);

    if (current - delta > 2) {
      pages.push("...");
    }

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      pages.push(i);
    }

    if (current + delta < total - 1) {
      pages.push("...");
    }

    if (total > 1) {
      pages.push(total);
    }

    return pages;
  };

  // History table functions
  const handleHistorySort = (field: string) => {
    if (historySortField === field) {
      setHistorySortDirection(historySortDirection === "asc" ? "desc" : "asc");
    } else {
      setHistorySortField(field);
      setHistorySortDirection("asc");
    }
    setHistoryCurrentPage(1);
  };

  const getHistorySortIcon = (field: string) => {
    if (historySortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return historySortDirection === "asc" ?
      <ArrowUp className="w-4 h-4 ml-1" /> :
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const getFilteredAndSortedHistory = (historyData: HistoryLicense[]) => {
    let filtered = historyData;

    // Apply search filter
    if (historySearchTerm) {
      filtered = historyData.filter(item =>
        item.description.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        item.last_user_input.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        formatCurrency(item.harga_satuan).toLowerCase().includes(historySearchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (historySortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[historySortField as keyof HistoryLicense];
        let bValue = b[historySortField as keyof HistoryLicense];

        // Handle numeric fields
        if (historySortField === 'harga_satuan') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        // Handle date fields
        if (historySortField === 'tanggal' || historySortField === 'createdAt') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        }

        if (historySortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  };

  const getPaginatedHistory = (historyData: HistoryLicense[]) => {
    const filteredAndSorted = getFilteredAndSortedHistory(historyData);
    const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
    const endIndex = startIndex + historyItemsPerPage;

    return {
      items: filteredAndSorted.slice(startIndex, endIndex),
      totalItems: filteredAndSorted.length,
      totalPages: Math.ceil(filteredAndSorted.length / historyItemsPerPage)
    };
  };

  const handleExportHistory = (license: License) => {
    try {
      const historyData = license.history_licenses.map((history, index) => ({
        'No': index + 1,
        'Nama Lisensi': license.name,
        'Harga Satuan': history.harga_satuan,
        'Berlaku Sejak': formatDate(history.tanggal),
        'Deskripsi': history.description,
        // 'Terakhir Input Oleh': history.last_user_input,
        'Tanggal Dibuat': formatDate(history.createdAt),
        'Tanggal Update': formatDate(history.updatedAt)
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Harga");

      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Riwayat Harga Lisensi_${license.name}_${today}.xlsx`);

      toast({
        title: "Berhasil",
        description: "Riwayat harga berhasil diekspor ke Excel",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor riwayat harga ke Excel",
        variant: "destructive"
      });
    }
  };

  const resetHistoryState = () => {
    setHistorySearchTerm("");
    setHistorySortField("");
    setHistorySortDirection("asc");
    setHistoryCurrentPage(1);
    setHistoryItemsPerPage(5);
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => navigate('/add')}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
            variant="success"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Lisensi
          </Button>
          <Button
            onClick={() => navigate('/prices')}
            variant="warning"
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <DollarSign className="w-4 h-4" />
            Harga Lisensi
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="flex items-center justify-center gap-2 w-full sm:w-auto">
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
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari lisensi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Total Data: {totalItems} - Tampilkan:</span>
          <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
            <SelectTrigger className="w-full sm:w-24">
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
            <DialogDescription>
              Upload file Excel untuk mengimport data lisensi baru
            </DialogDescription>
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
            <DialogDescription>
              Konfirmasi penghapusan data lisensi yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="text-center">
            <p>Apakah Anda yakin ingin menghapus lisensi "{selectedLicense?.name}"?</p>
            <p className="text-sm text-muted-foreground mt-1">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPriceHistoryDialogOpen} onOpenChange={setIsPriceHistoryDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
          <Dialog open={isPriceHistoryDialogOpen} onOpenChange={(open) => {
            setIsPriceHistoryDialogOpen(open);
            if (!open) resetHistoryState();
          }}>
            <DialogContent className="w-full max-w-full sm:max-w-4xl" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Riwayat Harga Lisensi
                </DialogTitle>
                <DialogDescription className="text-left">
                  Detail riwayat harga lisensi : {selectedLicense?.name}
                </DialogDescription>
              </DialogHeader>

              {selectedLicense && (
                <div className="space-y-4">
                  {/* Controls bar: search & tampilkan */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap w-full">
                    {/* Search */}
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Cari..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="pl-10 w-full"
                        tabIndex={-1}
                      />
                    </div>

                    {/* Select tampilkan */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Tampilkan:</span>
                      <Select
                        value={historyItemsPerPage.toString()}
                        onValueChange={(val) => setHistoryItemsPerPage(Number(val))}
                      >
                        <SelectTrigger className="w-full sm:w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Table History - Desktop & Tablet */}
                  <div className="hidden sm:block border rounded-lg overflow-x-auto">
                    <Table className="w-full min-w-[700px] text-sm">
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-b">

                          <TableHead className="w-12 text-center">No</TableHead>
                          <TableHead onClick={() => handleHistorySort("harga_satuan")} className="cursor-pointer">
                            <div className="flex items-center">
                              Harga Satuan
                              {getHistorySortIcon("harga_satuan")}
                            </div>
                          </TableHead>
                          <TableHead onClick={() => handleHistorySort("tanggal")} className="cursor-pointer">
                            <div className="flex items-center">
                              Berlaku Sejak
                              {getHistorySortIcon("tanggal")}
                            </div>
                          </TableHead>
                          <TableHead>Deskripsi</TableHead>
                          {/* <TableHead onClick={() => handleHistorySort("last_user_input")} className="cursor-pointer">
                            <div className="flex items-center">
                              User
                              {getHistorySortIcon("last_user_input")}
                            </div>
                          </TableHead> */}
                          <TableHead onClick={() => handleHistorySort("createdAt")} className="cursor-pointer">
                            <div className="flex items-center">
                              Tanggal Dibuat
                              {getHistorySortIcon("createdAt")}
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedHistory(selectedLicense.history_licenses).items.map((h, idx) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-center">
                              {(historyCurrentPage - 1) * historyItemsPerPage + idx + 1}
                            </TableCell>
                            <TableCell>{formatCurrency(h.harga_satuan)}</TableCell>
                            <TableCell>{formatDate(h.tanggal)}</TableCell>
                            <TableCell className="whitespace-pre-wrap break-words max-w-[200px]">
                              {h.description}
                            </TableCell>
                            {/* <TableCell>{h.last_user_input}</TableCell> */}
                            <TableCell>{formatDate(h.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                        {getPaginatedHistory(selectedLicense.history_licenses).items.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              Tidak ada data riwayat
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Table History - Mobile stacked view */}
                  <div className="block sm:hidden space-y-3">
                    {getPaginatedHistory(selectedLicense.history_licenses).items.length > 0 ? (
                      getPaginatedHistory(selectedLicense.history_licenses).items.map((h, idx) => (
                        <div
                          key={h.id}
                          className="border rounded-lg p-4 bg-card"
                        >
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>No: {(historyCurrentPage - 1) * historyItemsPerPage + idx + 1}</span>
                            <span>Berlaku sejak: {formatDate(h.tanggal)}</span>
                          </div>
                          <div className="font-medium text-sm">
                            {formatCurrency(h.harga_satuan)}
                          </div>
                          <div className="text-xs text-slate-400 whitespace-pre-wrap break-words mb-2">
                            {h.description}
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            {/* <span>User: {h.last_user_input}</span> */}
                            <span>Tanggal Dibuat: {formatDate(h.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Tidak ada data riwayat
                      </div>
                    )}
                  </div>

                  {/* Pagination + Export bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 w-full">
                    {/* Pagination kiri */}
                    <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-start w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryCurrentPage(p => Math.max(1, p - 1))}
                        disabled={historyCurrentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {getPageNumbers(historyCurrentPage, getPaginatedHistory(selectedLicense.history_licenses).totalPages).map((page, index) => (
                        <Button
                          key={index}
                          variant={historyCurrentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => typeof page === 'number' && setHistoryCurrentPage(page)}
                          disabled={page === "..."}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setHistoryCurrentPage(p =>
                            Math.min(getPaginatedHistory(selectedLicense.history_licenses).totalPages, p + 1)
                          )
                        }
                        disabled={historyCurrentPage === getPaginatedHistory(selectedLicense.history_licenses).totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Export kanan */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="success"
                        onClick={() => selectedLicense && handleExportHistory(selectedLicense)}
                        className="flex items-center gap-2 w-full sm:w-auto"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setIsPriceHistoryDialogOpen(false)}
                        className="w-full sm:w-auto"
                      >
                        Tutup
                      </Button>
                    </div>
                  </div>

                </div>
              )}
            </DialogContent>
          </Dialog>

          <div className="flex justify-end gap-2">
            <Button variant="destructive" onClick={() => setIsPriceHistoryDialogOpen(false)}>Batal</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dekstop/Tablet Mode */}
      <div className="hidden sm:block border rounded-lg overflow-x-auto">
        <Table className="[&_tr>*]:border-r [&_tr>*:last-child]:border-r-0 [&_tr]:border-b [&_tr:last-child]:border-b-0">
          <TableHeader>
            <TableRow className="bg-muted/50 border-b">
              <TableHead className="w-[120px] text-center whitespace-nowrap">Aksi</TableHead>
              <TableHead
                className="w-[200px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Nama Aset
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("start_date")}
              >
                <div className="flex items-center">
                  Tanggal Mulai
                  {getSortIcon("start_date")}
                </div>
              </TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("end_date")}
              >
                <div className="flex items-center">
                  Tanggal Berakhir
                  {getSortIcon("end_date")}
                </div>
              </TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("end_date")}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon("end_date")}
                </div>
              </TableHead>
              <TableHead
                className="w-[80px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("volume")}
              >
                <div className="flex items-center">
                  Volume
                  {getSortIcon("volume")}
                </div>
              </TableHead>
              <TableHead className="w-[100px] whitespace-nowrap">Satuan</TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("harga_satuan")}
              >
                <div className="flex items-center">
                  Harga Satuan
                  {getSortIcon("harga_satuan")}
                </div>
              </TableHead>
              <TableHead
                className="w-[150px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("jumlah")}
              >
                <div className="flex items-center">
                  Total Harga
                  {getSortIcon("jumlah")}
                </div>
              </TableHead>
              <TableHead
                className="w-[130px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center">
                  Tanggal Dibuat
                  {getSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead
                className="w-[130px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort("updatedAt")}
              >
                <div className="flex items-center">
                  Tanggal update
                  {getSortIcon("updatedAt")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-b-0">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : licenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  Tidak ada data lisensi yang ditemukan
                </TableCell>
              </TableRow>
            ) : (
              licenses.map((license, index) => {
                const status = getLicenseStatus(license.status_lisensi);
                return (
                  <React.Fragment key={license.uuid}>
                    <TableRow className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {/* Button Details */}
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
                          {/* Button Price History */}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAction("History", license)}

                          >
                            <History className="w-4 h-4" />
                          </Button>
                          {/* Button Edit */}
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleAction("Edit", license)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* Button Delete */}
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
                          const status = getLicenseStatus(license.status_lisensi);
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
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(license.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(license.updatedAt)}</TableCell>
                    </TableRow>
                    {expandedRows[index] && (
                      <TableRow className="bg-muted/5">
                        <TableCell colSpan={11} className="p-4">
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
                                {/* <div>
                                  <span className="font-medium">Dibuat pada:</span> {formatDate(license.createdAt)}
                                </div>
                                <div>
                                  <span className="font-medium">Diupdate pada:</span> {formatDate(license.updatedAt)}
                                </div> */}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Mode */}
      <div className="block sm:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Memuat data...
          </div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada data lisensi yang ditemukan
          </div>
        ) : (
          licenses.map((license, index) => {
            const status = getLicenseStatus(license.status_lisensi);
            const StatusIcon = status.icon;
            return (
              <div
                key={license.uuid}
                className="border rounded-lg p-4 bg-card"
              >
                {/* Header Card */}
                <div className="flex justify-between items-center mb-2">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {status.text}
                  </div>
                  <div className="flex items-center gap-2">
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="default" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleAction("History", license)}>
                          <History className="w-4 h-4 mr-2" />
                          Riwayat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Edit", license)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Delete", license)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Main Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama Lisensi:</span>
                    <span>{license.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal Mulai:</span>
                    <span>{formatDate(license.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal Berakhir:</span>
                    <span>{formatDate(license.end_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume x Harga Satuan:</span>
                    <span>{license.volume} {license.satuan} x {formatCurrency(license.harga_satuan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Harga:</span>
                    <span>{formatCurrency(license.jumlah)}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRows[index] && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2 text-sm">
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
                          className="sm:inline-flex">
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
                      <div>
                        <span className="font-medium">Catatan:</span>
                        <p className="mt-1 text-muted-foreground">{license.description}</p>
                      </div>
                      <div>
                        <span className="font-medium">Tanggal Dibuat</span> {formatDate(license.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">Tanggal Update:</span> {formatDate(license.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }))
        }
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
          {getPageNumbers(currentPage, totalPages).map((page, index) => (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === "..."}
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
