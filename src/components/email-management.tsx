import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Mail, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { BASE_URL } from "@/lib/config";

interface EmailRecipient {
  id: number;
  uuid: string;
  name: string;
  email: string;
  email_type: "to" | "cc" | "bcc";
  createdAt: string;
  updatedAt: string;
}

interface EmailManagementProps {
  children: React.ReactNode;
}

export const EmailManagement = ({ children }: EmailManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<EmailRecipient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    email_type: "to" as "to" | "cc" | "bcc"
  });
  const { toast } = useToast();

  const fetchEmailRecipients = async () => {
    try {
      setLoading(true);
      
      const response = await apiFetch(`${BASE_URL}/email/get`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.status === 200) {
        setEmailRecipients(data.data);
        
        // Show toast if no email recipients found
        if (!data.data || data.data.length === 0) {
          toast({
            title: "Info",
            description: "Tidak ada penerima email ditemukan",
            variant: "warning"
          });
        }
      } else if (data.status === 404) {
        setEmailRecipients([]);
        toast({
          title: "Info",
          description: "Belum ada data penerima email",
          variant: "warning"
        });
      } else {
        setEmailRecipients([]);
        toast({
          title: "Error",
          description: data.data || "Gagal memuat data penerima email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data penerima email: " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmailRecipients();
    }
  }, [isOpen]);

  const handleAddRecipient = async () => {
    if (!formData.name || !formData.email || !formData.email_type) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiFetch(`${BASE_URL}/email/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.status === 201) {
        toast({
          title: "Berhasil",
          description: "Penerima email berhasil ditambahkan",
          variant: "success"
        });
        setFormData({ name: "", email: "", email_type: "to" });
        setIsAddDialogOpen(false);
        fetchEmailRecipients();
      } else {
        toast({
          title: "Error",
          description: data.data || "Gagal menambahkan penerima email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menambahkan penerima email",
        variant: "destructive"
      });
    }
  };

  const handleEditRecipient = async () => {
    if (!editingRecipient || !formData.name || !formData.email || !formData.email_type) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiFetch(`${BASE_URL}/email/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: editingRecipient.uuid,
          ...formData
        })
      });

      const data = await response.json();
      if (data.status === 200) {
        toast({
          title: "Berhasil",
          description: "Penerima email berhasil diperbarui",
          variant: "success"
        });
        setFormData({ name: "", email: "", email_type: "to" });
        setEditingRecipient(null);
        setIsEditDialogOpen(false);
        fetchEmailRecipients();
      } else {
        toast({
          title: "Error",
          description: data.data || "Gagal memperbarui penerima email",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating email recipient:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memperbarui penerima email",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRecipient = async (uuid: string) => {
    try {
      const response = await apiFetch(`${BASE_URL}/email/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid })
      });

      if (response.status === 204) {
        toast({
          title: "Berhasil",
          description: "Penerima email berhasil dihapus",
          variant: "success"
        });
        fetchEmailRecipients();
      } else {
        let errorMessage = "Gagal menghapus penerima email";
        try {
          const data = await response.json();
          errorMessage = data.data || errorMessage;
        } catch { }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting email recipient:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus penerima email",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (recipient: EmailRecipient) => {
    setEditingRecipient(recipient);
    setFormData({
      name: recipient.name,
      email: recipient.email,
      email_type: recipient.email_type
    });
    setIsEditDialogOpen(true);
  };

  const getEmailTypeColor = (type: string) => {
    switch (type) {
      case "to": return "bg-success text-primary-foreground";
      case "cc": return "bg-warning text-secondary-foreground";
      case "bcc": return "bg-primary text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Kelola Penerima Email
            </DialogTitle>
            <DialogDescription className="text-left">
              Kelola daftar penerima email untuk notifikasi sistem
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
            <div className="flex justify-end">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="sm:hidden">Tambah</span>
                    <span className="hidden sm:inline">Tambah Penerima</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Tambah Penerima Email</DialogTitle>
                    <DialogDescription className="text-left">
                      Tambahkan penerima email baru untuk notifikasi
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Masukkan nama penerima"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Masukkan alamat email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_type">Tipe Email</Label>
                      <Select
                        value={formData.email_type}
                        onValueChange={(value: "to" | "cc" | "bcc") => 
                          setFormData({ ...formData, email_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe email" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to">To (Penerima Utama)</SelectItem>
                          <SelectItem value="cc">CC (Carbon Copy)</SelectItem>
                          <SelectItem value="bcc">BCC (Blind Carbon Copy)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                      <Button 
                        variant="destructive" 
                        onClick={() => setIsAddDialogOpen(false)}
                        className="w-full sm:w-auto"
                      >
                        Batal
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={handleAddRecipient}
                        className="w-full sm:w-auto"
                      >
                        Tambah
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-y-auto max-h-[50vh]">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="font-semibold">Nama</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Tipe</TableHead>
                      <TableHead className="text-right font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    ) : emailRecipients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Belum ada penerima email
                        </TableCell>
                      </TableRow>
                    ) : (
                      emailRecipients.map((recipient) => (
                        <TableRow key={recipient.uuid} className="border-b last:border-b-0">
                          <TableCell className="font-medium">{recipient.name}</TableCell>
                          <TableCell>{recipient.email}</TableCell>
                          <TableCell>
                            <Badge className={getEmailTypeColor(recipient.email_type)}>
                              {recipient.email_type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openEditDialog(recipient)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-center">Hapus Penerima Email</AlertDialogTitle>
                                    <AlertDialogDescription className="text-center">
                                      Apakah Anda yakin ingin menghapus penerima email "{recipient.name}"? 
                                      Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteRecipient(recipient.uuid)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 overflow-y-auto max-h-[50vh]">
              {loading ? (
                <div className="text-center py-8">
                  Memuat data...
                </div>
              ) : emailRecipients.length === 0 ? (
                <div className="text-center py-8">
                  Belum ada penerima email
                </div>
              ) : (
                emailRecipients.map((recipient) => (
                  <div key={recipient.uuid} className="border rounded-lg p-4 bg-card">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{recipient.name}</p>
                          <p className="text-sm text-muted-foreground truncate mt-1">{recipient.email}</p>
                          <Badge className={`${getEmailTypeColor(recipient.email_type)} mt-2`}>
                            {recipient.email_type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openEditDialog(recipient)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Hapus
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Penerima Email</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Apakah Anda yakin ingin menghapus penerima email "{recipient.name}"? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRecipient(recipient.uuid)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Penerima Email</DialogTitle>
            <DialogDescription>
              Ubah informasi penerima email yang sudah ada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama penerima"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Masukkan alamat email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email_type">Tipe Email</Label>
              <Select
                value={formData.email_type}
                onValueChange={(value: "to" | "cc" | "bcc") => 
                  setFormData({ ...formData, email_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to">To (Penerima Utama)</SelectItem>
                  <SelectItem value="cc">CC (Carbon Copy)</SelectItem>
                  <SelectItem value="bcc">BCC (Blind Carbon Copy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button 
                variant="destructive" 
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button 
                variant="default" 
                onClick={handleEditRecipient}
                className="w-full sm:w-auto"
              >
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};