import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Mail, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";

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
      const response = await apiFetch('http://localhost:8080/email/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_name: "http://localhost:8181",
          is_revoked: false
        })
      });

      const data = await response.json();
      if (data.status === 200) {
        setEmailRecipients(data.data);
      } else {
        setEmailRecipients([]);
      }
    } catch (error) {
      console.error('Error fetching email recipients:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penerima email",
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
      const response = await apiFetch('http://localhost:8080/email/create', {
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
          description: "Penerima email berhasil ditambahkan"
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
      console.error('Error adding email recipient:', error);
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
      const response = await apiFetch('http://localhost:8080/email/update', {
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
          description: "Penerima email berhasil diperbarui"
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
      const response = await apiFetch('http://localhost:8080/email/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid })
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Penerima email berhasil dihapus"
        });
        fetchEmailRecipients();
      } else {
        toast({
          title: "Error",
          description: data.data || "Gagal menghapus penerima email",
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
      case "to": return "bg-primary text-primary-foreground";
      case "cc": return "bg-secondary text-secondary-foreground";
      case "bcc": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Kelola Penerima Email
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Tambah Penerima
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Penerima Email</DialogTitle>
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
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button onClick={handleAddRecipient}>
                        Tambah
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
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
                      <TableRow key={recipient.uuid}>
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
                              variant="outline"
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
                                  <AlertDialogTitle>Hapus Penerima Email</AlertDialogTitle>
                                  <AlertDialogDescription>
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
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Penerima Email</DialogTitle>
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
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingRecipient(null);
                  setFormData({ name: "", email: "", email_type: "to" });
                }}
              >
                Batal
              </Button>
              <Button onClick={handleEditRecipient}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};