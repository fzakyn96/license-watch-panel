import { useRef } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatusCards } from "@/components/status-cards";
import { LicenseTable } from "@/components/license-table";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const statusCardsRef = useRef<{ refreshData: () => void } | null>(null);

  const handleDataChange = () => {
    statusCardsRef.current?.refreshData();
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onLogout={onLogout} />
      
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Dashboard Monitoring Lisensi
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Pantau status dan kelola lisensi aset
            </p>
          </div>
          
          <StatusCards ref={statusCardsRef} />
          
          <LicenseTable onDataChange={handleDataChange} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;