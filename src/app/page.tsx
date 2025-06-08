"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { GraduationCap, FileText, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  stats: {
    totalStudents: number;
    pendingInvoices: number;
    totalRevenue: number;
  };
  students: Array<{
    id: string;
    name: string;
    admissionId: string;
  }>;
  invoices: Array<{
    id: string;
    total: number;
    status: string;
  }>;
  uniforms: Array<{
    id: string;
    items: any;
  }>;
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await fetch("/api/accounting");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Chart data transformation
  const chartData = [
    { name: "Jan", paid: 4000, pending: 2400 },
    { name: "Feb", paid: 3000, pending: 1398 },
    // Add more data...
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center gap-3 p-8 bg-red-50 rounded-lg">
          <p className="text-muted-foreground text-sm border border-red-500 text-red-500 rounded-full px-8 py-2">Vumba View Academy</p>
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-xl font-semibold text-red-600">An error occurred</h3>
          <p className="text-muted-foreground text-center">
            Please check your network connection and try again
          </p>
          <Button
            variant="outline"
            className="mt-4 text-red-500 border-red-300"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <article className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold mb-6">Vumba View Academy</h1>
        <p className="text-muted-foreground text-sm">
          Today is {format(new Date(), "EEEE, MMMM do")}
        </p>
      </article>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 w-full">
        <Card className="p-0 bg-gradient-to-tr from-sky-400 to-blue-600 shadow-lg">
          <CardContent className="flex items-center gap-4 p-8">
            <div className="bg-white/20 rounded-full p-3">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <div>
              <h3 className="font-medium text-white">Total Students</h3>
              <p className="text-3xl font-bold text-white">
                {data?.stats.totalStudents || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-0 bg-gradient-to-tr from-amber-400 to-yellow-600 shadow-lg">
          <CardContent className="flex items-center gap-4 p-8">
            <div className="bg-white/20 rounded-full p-3">
              <FileText className="text-white w-8 h-8" />
            </div>
            <div>
              <h3 className="font-medium text-white">Pending Invoices</h3>
              <p className="text-3xl font-bold text-white">
                {data?.stats.pendingInvoices || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-0 bg-gradient-to-tr from-green-400 to-emerald-600 shadow-lg">
          <CardContent className="flex items-center gap-4 p-8">
            <div className="bg-white/20 rounded-full p-3">
              <DollarSign className="text-white w-8 h-8" />
            </div>
            <div>
              <h3 className="font-medium text-white">Revenue (30d)</h3>
              <p className="text-3xl font-bold text-white">
                ${(data?.stats.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <h3 className="font-medium mb-4">Payments Overview</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="paid" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Students Section */}
      <Card className="mt-6 p-4">
        <h3 className="font-medium mb-4">Recent Students</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data?.students.slice(0, 6).map((student) => (
            <Card key={student.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <GraduationCap className="text-blue-600 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium">{student.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {student.admissionId}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}