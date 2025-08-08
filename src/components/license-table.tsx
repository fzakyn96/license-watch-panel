import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface License {
  id: string;
  assetName: string;
  licenseType: string;
  vendor: string;
  purchaseDate: string;
  expiryDate: string;
  status: "safe" | "expiring" | "expired";
  cost: number;
}

const mockData: License[] = [
  {
    id: "LIC001",
    assetName: "Microsoft Office 365",
    licenseType: "Software",
    vendor: "Microsoft",
    purchaseDate: "2023-01-15",
    expiryDate: "2024-01-15",
    status: "expiring",
    cost: 15000000
  },
  {
    id: "LIC002", 
    assetName: "Adobe Creative Suite",
    licenseType: "Software",
    vendor: "Adobe",
    purchaseDate: "2022-06-01",
    expiryDate: "2025-06-01",
    status: "safe",
    cost: 8000000
  },
  {
    id: "LIC003",
    assetName: "Antivirus Enterprise",
    licenseType: "Security",
    vendor: "Symantec",
    purchaseDate: "2022-12-01",
    expiryDate: "2023-12-01",
    status: "expired",
    cost: 5000000
  },
  {
    id: "LIC004",
    assetName: "Windows Server 2022",
    licenseType: "Operating System",
    vendor: "Microsoft",
    purchaseDate: "2023-03-01",
    expiryDate: "2026-03-01",
    status: "safe",
    cost: 25000000
  },
  {
    id: "LIC005",
    assetName: "Database Oracle",
    licenseType: "Database",
    vendor: "Oracle",
    purchaseDate: "2023-08-15",
    expiryDate: "2024-02-15",
    status: "expiring",
    cost: 45000000
  }
];

export const LicenseTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [licenses] = useState<License[]>(mockData);
  const { toast } = useToast();

  const filteredLicenses = licenses.filter(license =>
    license.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.licenseType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: License["status"]) => {
    switch (status) {
      case "safe":
        return <Badge className="bg-success text-success-foreground">Aman</Badge>;
      case "expiring":
        return <Badge className="bg-warning text-warning-foreground">Akan Kadaluarsa</Badge>;
      case "expired":
        return <Badge className="bg-destructive text-destructive-foreground">Kadaluarsa</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExport = () => {
    toast({
      title: "Export berhasil",
      description: "Data lisensi telah diekspor ke file Excel",
    });
  };

  const handleImport = () => {
    toast({
      title: "Import Excel",
      description: "Fitur import akan segera tersedia",
    });
  };

  const handleAction = (action: string, licenseId: string) => {
    toast({
      title: `${action} License`,
      description: `${action} untuk lisensi ${licenseId}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cari lisensi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>ID Lisensi</TableHead>
              <TableHead>Nama Aset</TableHead>
              <TableHead>Tipe Lisensi</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Tanggal Beli</TableHead>
              <TableHead>Tanggal Kadaluarsa</TableHead>
              <TableHead>Biaya</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.map((license) => (
              <TableRow key={license.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{license.id}</TableCell>
                <TableCell>{license.assetName}</TableCell>
                <TableCell>{license.licenseType}</TableCell>
                <TableCell>{license.vendor}</TableCell>
                <TableCell>{new Date(license.purchaseDate).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{new Date(license.expiryDate).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{formatCurrency(license.cost)}</TableCell>
                <TableCell>{getStatusBadge(license.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction("Detail", license.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction("Edit", license.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction("Delete", license.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredLicenses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada data lisensi yang ditemukan
        </div>
      )}
    </div>
  );
};