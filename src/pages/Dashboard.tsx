import { useState, useRef } from "react";
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Dashboard Monitoring Lisensi
            </h2>
            <p className="text-muted-foreground">
              Pantau status dan kelola lisensi aset perusahaan Anda
            </p>
          </div>
          
          <StatusCards ref={statusCardsRef} />
          
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Daftar Lisensi Aset
            </h3>
            <LicenseTable onDataChange={handleDataChange} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;