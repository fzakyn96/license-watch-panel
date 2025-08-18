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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, Loader2, Shield, Download, CheckCircle2, AlertCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown, History, Eye, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { useTheme } from "next-themes";
import * as XLSX from 'xlsx';

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
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // History dialog states
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historySortField, setHistorySortField] = useState<string>("");
  const [historySortDirection, setHistorySortDirection] = useState<"asc" | "desc">("asc");
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(5);
  
  const { toast } = useToast();

  const fetchLicenses = async (page: number, paginate: number, searchQuery?: string) => {
    try {
      setIsLoading(true);
      let url = `${import.meta.env.VITE_BASE_URL}/licenses/get?page=${page}&paginate=${paginate}&sortField=end_date&sortDirection=desc&name=`;
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

  const handleExportToExcel = async () => {
    try {
      const response = await apiFetch(`${import.meta.env.VITE_BASE_URL}/licenses/export`);
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
          'Terakhir Diubah Oleh': license.last_user_input
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
                'Tanggal Record': formatDate(history.tanggal),
                'Deskripsi (History)': history.description,
                'Terakhir Input Oleh': history.last_user_input,
                'Dibuat Pada': formatDate(history.createdAt)
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
          XLSX.utils.book_append_sheet(workbook, historyWorksheet, "History Harga");
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
        'Tanggal Record': formatDate(history.tanggal),
        'Deskripsi': history.description,
        'Terakhir Input Oleh': history.last_user_input,
        'Dibuat Pada': formatDate(history.createdAt)
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "History Harga");

      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `History_${license.name}_${today}.xlsx`);

      toast({
        title: "Berhasil",
        description: "History berhasil diekspor ke Excel",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor history ke Excel",
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Harga Lisensi
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Daftar harga dan informasi lisensi aset perusahaan
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
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <span className="text-sm text-muted-foreground">Tampilkan:</span>
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

            <div className="border rounded-lg overflow-x-auto">
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
                         <TableCell>
                           <Dialog onOpenChange={(open) => !open && resetHistoryState()}>
                             <DialogTrigger asChild>
                               <Button
                                 variant="default"
                                 size="sm"
                                 className="h-8 w-8 p-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                                 disabled={!license.history_licenses || license.history_licenses.length === 0}
                               >
                                 <History className="h-4 w-4" />
                               </Button>
                             </DialogTrigger>
                             <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                               <DialogHeader className="flex-shrink-0">
                                 <DialogTitle className="text-lg sm:text-xl">History Harga - {license.name}</DialogTitle>
                               </DialogHeader>
                               <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                                 {license.history_licenses && license.history_licenses.length > 0 ? (
                                   <>
                                     {/* Controls */}
                                     <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                       <div className="relative flex-1 max-w-sm w-full">
                                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                         <Input
                                           placeholder="Cari history..."
                                           value={historySearchTerm}
                                           onChange={(e) => {
                                             setHistorySearchTerm(e.target.value);
                                             setHistoryCurrentPage(1);
                                           }}
                                           className="pl-10"
                                         />
                                       </div>
                                       <div className="flex items-center gap-2">
                                         <Button
                                           onClick={() => handleExportHistory(license)}
                                           variant="success"
                                           size="sm"
                                           className="flex items-center gap-2"
                                         >
                                           <FileSpreadsheet className="w-4 h-4" />
                                           <span className="hidden sm:inline">Export</span>
                                         </Button>
                                         <span className="text-sm text-muted-foreground hidden sm:inline">Tampilkan:</span>
                                         <Select 
                                           value={historyItemsPerPage.toString()} 
                                           onValueChange={(value) => {
                                             setHistoryItemsPerPage(parseInt(value));
                                             setHistoryCurrentPage(1);
                                           }}
                                         >
                                           <SelectTrigger className="w-16">
                                             <SelectValue />
                                           </SelectTrigger>
                                           <SelectContent>
                                             <SelectItem value="5">5</SelectItem>
                                             <SelectItem value="10">10</SelectItem>
                                             <SelectItem value="25">25</SelectItem>
                                           </SelectContent>
                                         </Select>
                                       </div>
                                     </div>

                                     {/* Table */}
                                     <div className="flex-1 border rounded-lg overflow-hidden">
                                       <div className="overflow-x-auto overflow-y-auto max-h-96">
                                         <Table className="[&_tr>*]:border-r [&_tr>*:last-child]:border-r-0 [&_tr]:border-b [&_tr:last-child]:border-b-0">
                                           <TableHeader className="sticky top-0 bg-background">
                                             <TableRow className="bg-muted/50 border-b">
                                               <TableHead className="w-[50px] text-center">No</TableHead>
                                               <TableHead 
                                                 className="w-[130px] cursor-pointer hover:bg-muted/70 whitespace-nowrap"
                                                 onClick={() => handleHistorySort("harga_satuan")}
                                               >
                                                 <div className="flex items-center text-xs sm:text-sm">
                                                   Harga Satuan
                                                   {getHistorySortIcon("harga_satuan")}
                                                 </div>
                                               </TableHead>
                                               <TableHead 
                                                 className="w-[110px] cursor-pointer hover:bg-muted/70 whitespace-nowrap"
                                                 onClick={() => handleHistorySort("tanggal")}
                                               >
                                                 <div className="flex items-center text-xs sm:text-sm">
                                                   Tanggal
                                                   {getHistorySortIcon("tanggal")}
                                                 </div>
                                               </TableHead>
                                               <TableHead 
                                                 className="w-[180px] cursor-pointer hover:bg-muted/70"
                                                 onClick={() => handleHistorySort("description")}
                                               >
                                                 <div className="flex items-center text-xs sm:text-sm">
                                                   Deskripsi
                                                   {getHistorySortIcon("description")}
                                                 </div>
                                               </TableHead>
                                               <TableHead 
                                                 className="w-[130px] cursor-pointer hover:bg-muted/70 whitespace-nowrap"
                                                 onClick={() => handleHistorySort("last_user_input")}
                                               >
                                                 <div className="flex items-center text-xs sm:text-sm">
                                                   Input Oleh
                                                   {getHistorySortIcon("last_user_input")}
                                                 </div>
                                               </TableHead>
                                               <TableHead 
                                                 className="w-[110px] cursor-pointer hover:bg-muted/70 whitespace-nowrap"
                                                 onClick={() => handleHistorySort("createdAt")}
                                               >
                                                 <div className="flex items-center text-xs sm:text-sm">
                                                   Dibuat
                                                   {getHistorySortIcon("createdAt")}
                                                 </div>
                                               </TableHead>
                                             </TableRow>
                                           </TableHeader>
                                           <TableBody>
                                             {(() => {
                                               const { items, totalItems } = getPaginatedHistory(license.history_licenses);
                                               return items.length > 0 ? items.map((history, index) => (
                                                 <TableRow key={history.uuid} className="hover:bg-muted/30">
                                                   <TableCell className="text-center text-xs sm:text-sm">
                                                     {((historyCurrentPage - 1) * historyItemsPerPage) + index + 1}
                                                   </TableCell>
                                                   <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                                                     {formatCurrency(history.harga_satuan)}
                                                   </TableCell>
                                                   <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                                                     {formatDate(history.tanggal)}
                                                   </TableCell>
                                                   <TableCell className="max-w-[150px] sm:max-w-xs">
                                                     <div className="truncate text-xs sm:text-sm" title={history.description}>
                                                       {history.description}
                                                     </div>
                                                   </TableCell>
                                                   <TableCell className="text-xs sm:text-sm">{history.last_user_input}</TableCell>
                                                   <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                                                     {formatDate(history.createdAt)}
                                                   </TableCell>
                                                 </TableRow>
                                               )) : (
                                                 <TableRow>
                                                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                     Tidak ada history yang ditemukan
                                                   </TableCell>
                                                 </TableRow>
                                               );
                                             })()}
                                           </TableBody>
                                         </Table>
                                       </div>
                                     </div>

                                     {/* Pagination */}
                                     {(() => {
                                       const { totalPages } = getPaginatedHistory(license.history_licenses);
                                       return totalPages > 1 && (
                                         <div className="flex-shrink-0 flex items-center justify-between">
                                           <div className="flex items-center gap-2">
                                             <Button
                                               variant="outline"
                                               size="sm"
                                               onClick={() => setHistoryCurrentPage(Math.max(1, historyCurrentPage - 1))}
                                               disabled={historyCurrentPage === 1}
                                             >
                                               <ChevronLeft className="w-4 h-4" />
                                               <span className="hidden sm:inline ml-1">Previous</span>
                                             </Button>
                                             <div className="flex items-center gap-1">
                                               {getPageNumbers(historyCurrentPage, totalPages).map((page, index) => (
                                                 <Button
                                                   key={index}
                                                   variant={page === historyCurrentPage ? "default" : "outline"}
                                                   size="sm"
                                                   className="w-8 h-8 p-0"
                                                   onClick={() => typeof page === 'number' && setHistoryCurrentPage(page)}
                                                   disabled={typeof page !== 'number'}
                                                 >
                                                   {page}
                                                 </Button>
                                               ))}
                                             </div>
                                             <Button
                                               variant="outline"
                                               size="sm"
                                               onClick={() => setHistoryCurrentPage(Math.min(totalPages, historyCurrentPage + 1))}
                                               disabled={historyCurrentPage === totalPages}
                                             >
                                               <span className="hidden sm:inline mr-1">Next</span>
                                               <ChevronRight className="w-4 h-4" />
                                             </Button>
                                           </div>
                                           <div className="text-xs sm:text-sm text-muted-foreground">
                                             Halaman {historyCurrentPage} dari {totalPages}
                                           </div>
                                         </div>
                                       );
                                     })()}
                                   </>
                                 ) : (
                                   <div className="text-center py-8 text-muted-foreground">
                                     Tidak ada history harga untuk lisensi ini
                                   </div>
                                 )}
                               </div>
                             </DialogContent>
                           </Dialog>
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