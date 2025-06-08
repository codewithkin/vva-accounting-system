"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  FileText,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  format,
  subDays,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { saveAs } from "file-saver";

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
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  uniforms: Array<{
    id: string;
    items: any;
    createdAt: string;
  }>;
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await axios.get(
    `${
      process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : "https://vva-server-397iy.kinsta.app/"
    }/api/accounting/`
  );
  return response.data;
};

const chartConfig = {
  invoices: {
    label: "Invoices",
    color: "var(--chart-1)",
  },
  uniforms: {
    label: "Uniforms",
    color: "var(--chart-2)",
  },
  students: {
    label: "Students",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const [timeRange, setTimeRange] = React.useState<string>("30d");
  const [timeFilter, setTimeFilter] = React.useState<string>("month");

  // Transform data for the chart
  const transformChartData = () => {
    if (!data) return [];

    // Group data by date
    const dateMap: Record<
      string,
      { invoices: number; uniforms: number; students: number; date: string }
    > = {};

    // Process invoices
    data.invoices.forEach((invoice) => {
      const date = new Date(invoice.createdAt).toISOString().split("T")[0];
      if (!dateMap[date]) {
        dateMap[date] = { invoices: 0, uniforms: 0, students: 0, date };
      }
      dateMap[date].invoices += invoice.total;
    });

    // Process uniforms
    data.uniforms.forEach((uniform) => {
      const date = new Date(uniform.createdAt).toISOString().split("T")[0];
      if (!dateMap[date]) {
        dateMap[date] = { invoices: 0, uniforms: 0, students: 0, date };
      }
      // Sum quantities if items is an array, otherwise count as 1
      if (Array.isArray(uniform.items)) {
        dateMap[date].uniforms += uniform.items.reduce(
          (sum, item) => sum + (item.quantity || 1),
          0
        );
      } else {
        dateMap[date].uniforms += 1;
      }
    });

    // Process students
    data.students.forEach((student) => {
      const date = new Date(student.createdAt).toISOString().split("T")[0];
      if (!dateMap[date]) {
        dateMap[date] = { invoices: 0, uniforms: 0, students: 0, date };
      }
      dateMap[date].students += 1;
    });

    // Convert to array and sort by date
    return Object.values(dateMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const allChartData = transformChartData();

  const filterDataByTime = (data: typeof allChartData) => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case "today":
        startDate = subDays(now, 1);
        break;
      case "week":
        startDate = startOfWeek(now);
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "year":
        startDate = startOfYear(now);
        break;
      default:
        return data;
    }

    return data.filter((item) => new Date(item.date) >= startDate);
  };

  const filteredByTime = filterDataByTime(allChartData);

  const filteredData = filteredByTime.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 30;
    if (timeRange === "90d") {
      daysToSubtract = 90;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const handleExportCSV = () => {
    const exportData = filteredData.length > 0 ? filteredData : allChartData;

    if (exportData.length === 0) {
      return;
    }

    const headers = "Date,Invoices,Uniforms,Students\n";
    const csvRows = exportData
      .map(
        (item) =>
          `${item.date},${item.invoices},${item.uniforms},${item.students}`
      )
      .join("\n");

    const csv = headers + csvRows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(
      blob,
      `vumba-view-academy-data-${new Date().toISOString().split("T")[0]}.csv`
    );
  };

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
          <p className="text-muted-foreground text-sm border border-red-500 text-red-500 rounded-full px-8 py-2">
            Vumba View Academy
          </p>
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-xl font-semibold text-red-600">
            An error occurred
          </h3>
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

      <Card className="mt-6">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>School Activity Overview</CardTitle>
            <CardDescription>
              Showing school activities including enrollments, invoices, and
              uniform purchases
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[120px] rounded-lg">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="today" className="rounded-lg">
                  Today
                </SelectItem>
                <SelectItem value="week" className="rounded-lg">
                  This Week
                </SelectItem>
                <SelectItem value="month" className="rounded-lg">
                  This Month
                </SelectItem>
                <SelectItem value="year" className="rounded-lg">
                  This Year
                </SelectItem>
                <SelectItem value="all" className="rounded-lg">
                  All Time
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] rounded-lg">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 Days
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 Days
                </SelectItem>
                <SelectItem value="90d" className="rounded-lg">
                  Last 90 Days
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={handleExportCSV}
              disabled={allChartData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {filteredData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient
                    id="fillInvoices"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-invoices)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-invoices)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillUniforms"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-uniforms)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-uniforms)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillStudents"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-students)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-students)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="invoices"
                  type="natural"
                  fill="url(#fillInvoices)"
                  stroke="var(--color-invoices)"
                  stackId="a"
                />
                <Area
                  dataKey="uniforms"
                  type="natural"
                  fill="url(#fillUniforms)"
                  stroke="var(--color-uniforms)"
                  stackId="a"
                />
                <Area
                  dataKey="students"
                  type="natural"
                  fill="url(#fillStudents)"
                  stroke="var(--color-students)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] gap-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                No data available for the selected time period
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 p-4">
        <h3 className="font-medium mb-4">Recent Students</h3>
        {data?.students && data.students.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.students.slice(0, 6).map((student) => (
              <Card
                key={student.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
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
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <GraduationCap className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No students found</p>
          </div>
        )}
      </Card>
    </div>
  );
}