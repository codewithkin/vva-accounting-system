import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { GraduationCap, FileText, DollarSign } from "lucide-react";

const data = [
  { name: "Jan", paid: 4000, pending: 2400 },
  { name: "Feb", paid: 3000, pending: 1398 },
  // Add more data...
];

export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 w-full">
        <Card className="p-0 bg-gradient-to-tr from-sky-400 to-blue-600 shadow-lg">
          <CardContent className="flex items-center gap-4 p-8">
            <div className="bg-white/20 rounded-full p-3">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <div>
              <h3 className="font-medium text-white">Total Students</h3>
              <p className="text-3xl font-bold text-white">124</p>
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
              <p className="text-3xl font-bold text-white">12</p>
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
              <p className="text-3xl font-bold text-white">$3,240</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <h3 className="font-medium mb-4">Payments Overview</h3>
        {/* Chart can be added here */}
      </Card>
    </div>
  );
}