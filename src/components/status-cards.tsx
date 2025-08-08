import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface StatusCard {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const StatusCards = () => {
  const statusData: StatusCard[] = [
    {
      title: "Lisensi Aman",
      count: 45,
      icon: <CheckCircle className="w-8 h-8" />,
      color: "text-success-foreground",
      bgColor: "bg-success"
    },
    {
      title: "Akan Kadaluarsa",
      count: 12,
      icon: <AlertTriangle className="w-8 h-8" />,
      color: "text-warning-foreground",
      bgColor: "bg-warning"
    },
    {
      title: "Sudah Kadaluarsa",
      count: 3,
      icon: <XCircle className="w-8 h-8" />,
      color: "text-destructive-foreground",
      bgColor: "bg-destructive"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statusData.map((status, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {status.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${status.bgColor} ${status.color}`}>
              {status.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {status.count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total lisensi dengan status ini
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};