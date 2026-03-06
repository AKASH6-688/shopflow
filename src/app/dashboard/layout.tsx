"use client";

import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
