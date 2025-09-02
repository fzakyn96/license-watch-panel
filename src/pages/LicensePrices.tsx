import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, Loader2, Shield, Download, CheckCircle2, AlertCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown, History, Eye, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { useTheme } from "next-themes";
import * as XLSX from 'xlsx';
import { BASE_URL } from "@/lib/config";

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

interface License {
  id: number;
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
  status_lisensi: number;
  last_user_input: string;
  createdAt: string;
  updatedAt: string;
  history_licenses: HistoryLicense[];
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

interface ExportPrice {
  status: number;
  data: License[];
}

interface LicensePricesProps {
  onLogout: () => void;
}

const LicensePrices = ({ onLogout }: LicensePricesProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // History dialog states
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historySortField, setHistorySortField] = useState<string>("");
  const [historySortDirection, setHistorySortDirection] = useState<"asc" | "desc">("asc");
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(5);

  const [isPriceHistoryDialogOpen, setIsPriceHistoryDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const { toast } = useToast();

  const fetchLicenses = async (page: number, paginate: number, searchQuery?: string) => {
    try {
      setIsLoading(true);
      let url = `${BASE_URL}/licenses/get?page=${page}&paginate=${paginate}&sortField=end_date&sortOrder=desc&name=`;
      if (searchQuery) {
        url += `${encodeURIComponent(searchQuery)}`;
      }

      const response = await apiFetch(url);
      const data: ApiResponse = await response.json();

      if (data.status === 200) {
        let sortedLicenses = data.data.docs;

        // Apply client-side sorting if sort is enabled
        if (sortField) {
          sortedLicenses = [...sortedLicenses].sort((a, b) => {
            let aValue = a[sortField as keyof License];
            let bValue = b[sortField as keyof License];

            // Handle numeric fields
            if (sortField === 'harga_satuan') {
              aValue = Number(aValue);
              bValue = Number(bValue);
            }

            // Handle date fields
            if (sortField === 'start_date' || sortField === 'end_date') {
              aValue = new Date(aValue as string).getTime();
              bValue = new Date(bValue as string).getTime();
            }

            if (sortDirection === 'asc') {
              return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
              return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
          });
        }

        setLicenses(sortedLicenses);
        setTotalPages(data.data.pages);
        setTotalItems(data.data.total);
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
    if (searchTerm) {
      const delayDebounce = setTimeout(() => {
        fetchLicenses(1, parseInt(itemsPerPage), searchTerm);
        setCurrentPage(1);
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else {
      fetchLicenses(currentPage, parseInt(itemsPerPage));
    }
  }, [currentPage, itemsPerPage, sortField, sortDirection, searchTerm]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAction = (action: string, license: License) => {
    if (action === "History") {
      setSelectedLicense(license);
      setIsPriceHistoryDialogOpen(true);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const response = await apiFetch(`${BASE_URL}/licenses/export`);
      const data: ExportPrice = await response.json();

      if (data.status === 200) {
        // Main license data
        const exportData = data.data.map((license, index) => ({
          'No': index + 1,
          'Nama Lisensi': license.name,
          'Volume': license.volume,
          'Satuan': license.satuan,
          'Harga Satuan': license.harga_satuan,
          'Total Harga': license.jumlah,
          'Tanggal Mulai': formatDate(license.start_date),
          'Tanggal Berakhir': formatDate(license.end_date),
          'Lokasi Lisensi': license.lokasi_lisensi,
          'Deskripsi': license.description,
          // 'Terakhir Diubah Oleh': license.last_user_input
        }));

        // History data
        const historyData: any[] = [];
        data.data.forEach((license, licenseIndex) => {
          if (license.history_licenses && license.history_licenses.length > 0) {
            license.history_licenses.forEach((history, historyIndex) => {
              historyData.push({
                'No': `${licenseIndex + 1}.${historyIndex + 1}`,
                'Nama Lisensi': license.name,
                'Harga Satuan (History)': history.harga_satuan,
                'Berlaku Sejak': formatDate(history.tanggal),
                'Deskripsi (History)': history.description,
                // 'Terakhir Input Oleh': history.last_user_input,
                'Tanggal Dibuat': formatDate(history.createdAt)
              });
            });
          }
        });

        const workbook = XLSX.utils.book_new();

        // Main data worksheet
        const mainWorksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, mainWorksheet, "Harga Lisensi");

        // History data worksheet
        if (historyData.length > 0) {
          const historyWorksheet = XLSX.utils.json_to_sheet(historyData);
          XLSX.utils.book_append_sheet(workbook, historyWorksheet, "Riwayat Harga");
        }

        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Harga_Lisensi_${today}.xlsx`);

        toast({
          title: "Berhasil",
          description: "Data berhasil diekspor ke Excel dengan history",
          variant: "success"
        });
      } else {
        toast({
          title: "Info",
          description: "Tidak ada data yang bisa diekspor (data kosong)",
          variant: "warning"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor data ke Excel",
        variant: "destructive"
      });
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ?
      <ArrowUp className="w-4 h-4 ml-1" /> :
      <ArrowDown className="w-4 h-4 ml-1" />;
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
        'Tanggal Dibuat': formatDate(history.createdAt)
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
    <div>
      <header className="bg-card border-b border-border shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src={theme === 'dark' ? '/lisa/logo-dark.png' : '/lisa/logo-white.png'}
                alt="Lisensi Aset Logo"
                className="h-8 w-auto sm:h-8 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Lisensi Aset</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Sistem Monitoring Lisensi Aset</p>
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

      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Harga Lisensi
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Daftar harga dan informasi lisensi
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleExportToExcel}
                variant="success"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Title with Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Daftar Harga Lisensi
                </h3>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 max-w-sm w-full md:w-auto">
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
                        Detail riwayat harga lisensi: {selectedLicense?.name}
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
                                  <span>{formatDate(h.tanggal)}</span>
                                </div>
                                <div className="font-medium text-sm">
                                  {formatCurrency(h.harga_satuan)}
                                </div>
                                <div className="text-xs text-slate-400 whitespace-pre-wrap break-words mb-2">
                                  {h.description}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>User: {h.last_user_input}</span>
                                  <span>Dibuat: {formatDate(h.createdAt)}</span>
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
            <div className="hidden sm:block w-full overflow-x-auto border rounded-lg overflow-x-auto">
              <Table className="[&_tr>*]:border-r [&_tr>*:last-child]:border-r-0 [&_tr]:border-b [&_tr:last-child]:border-b-0">
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b">
                    <TableHead className="w-[80px] whitespace-nowrap">Aksi</TableHead>
                    <TableHead
                      className="w-[200px] whitespace-nowrap cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Nama Lisensi
                        {getSortIcon("name")}
                      </div>
                    </TableHead>
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
                    <TableHead className="w-[200px] whitespace-nowrap">Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:last-child]:border-b-0">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : licenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada data harga lisensi yang ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    licenses.map((license) => (
                      <TableRow key={license.uuid} className="hover:bg-muted/30">
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Dialog onOpenChange={(open) => !open && resetHistoryState()}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAction("History", license)}

                                >
                                  <History className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{license.name}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{formatCurrency(license.harga_satuan)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(license.start_date)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(license.end_date)}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={license.description}>
                            {license.description}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Mode */}
            <div className="block sm:hidden space-y-3">
              {licenses.map((license) => (
                <div
                  key={license.uuid}
                  className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{license.name}</h4>
                    <Dialog onOpenChange={(open) => !open && resetHistoryState()}>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAction("History", license)}

                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                  <p className="text-sm text-muted-foreground">{license.description}</p>
                  <div className="text-sm">
                    <div><span className="font-medium">Harga:</span> {formatCurrency(license.harga_satuan)}</div>
                    <div><span className="font-medium">Mulai:</span> {formatDate(license.start_date)}</div>
                    <div><span className="font-medium">Berakhir:</span> {formatDate(license.end_date)}</div>
                  </div>
                </div>
              ))}
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
        </div>
      </main>
    </div>
  );
};

export default LicensePrices;