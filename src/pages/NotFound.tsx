import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="text-center max-w-md mx-auto animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative bg-card border rounded-full w-32 h-32 mx-auto flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-16 h-16 text-primary animate-scale-in" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold mb-4 text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold mb-2 text-foreground">
          Halaman Tidak Ditemukan
        </h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Maaf, halaman yang Anda cari tidak dapat ditemukan. 
          Halaman mungkin telah dipindahkan atau dihapus.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="hover-scale">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </Button>
          
          <Button variant="outline" onClick={() => window.history.back()} className="hover-scale">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Halaman Sebelumnya
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <p>URL: <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
