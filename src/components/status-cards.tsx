import { useEffect, useState, forwardRef, useImperativeHandle, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface StatusData {
  status: string;
  count: number;
  total_data: number;
}

interface StatusCard {
  title: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface StatusCardsProps {}

interface StatusCardsRef {
  refreshData: () => void;
}

const StatusCardsComponent = forwardRef<StatusCardsRef, StatusCardsProps>((props, ref) => {
  const [statusData, setStatusData] = useState<StatusCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    try {
      const response = await apiFetch(`${import.meta.env.VITE_BASE_URL}/home/get`);
      const result = await response.json();

      if (result.status === 200 && result.data) {
        const formattedData = result.data.map((item: StatusData) => {
          switch (item.status) {
            case 'secure':
              return {
                title: "Lisensi Aman",
                count: item.count,
                total: item.total_data,
                icon: <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" />,
                color: "text-success-foreground",
                bgColor: "bg-success"
              };
            case 'will_expire':
              return {
                title: "Akan Kadaluarsa",
                count: item.count,
                total: item.total_data,
                icon: <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />,
                color: "text-warning-foreground",
                bgColor: "bg-warning"
              };
            case 'expired':
              return {
                title: "Sudah Kadaluarsa",
                count: item.count,
                total: item.total_data,
                icon: <XCircle className="w-6 h-6 sm:w-8 sm:h-8" />,
                color: "text-destructive-foreground",
                bgColor: "bg-destructive"
              };
            default:
              return null;
          }
        }).filter(Boolean) as StatusCard[];

        setStatusData(formattedData);
        setError(null);
      } else {
        throw new Error('Data tidak valid');
      }
    } catch (err) {
      const errorMessage = 'Gagal memuat data status lisensi';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshData: fetchStatusData
  }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="overflow-hidden animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20 sm:w-24"></div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-muted rounded-lg"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 sm:h-8 bg-muted rounded w-12 sm:w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24 sm:w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 sm:p-6 border-destructive mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          <p className="text-sm sm:text-base">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {statusData.map((status, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-muted-foreground">
              {status.title}
            </CardTitle>
            <div className={`p-2 sm:p-2 rounded-lg ${status.bgColor} ${status.color} flex items-center justify-center`}>
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                {status.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {status.count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {status.count} dari {status.total} lisensi
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export const StatusCards = memo(StatusCardsComponent);