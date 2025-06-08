import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", paid: 4000, pending: 2400 },
  { name: "Feb", paid: 3000, pending: 1398 },
  // Add more data...
];

export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h3 className="font-medium">Total Students</h3>
          <p className="text-3xl font-bold">124</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium">Pending Invoices</h3>
          <p className="text-3xl font-bold text-amber-500">12</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium">Revenue (30d)</h3>
          <p className="text-3xl font-bold text-green-500">$3,240</p>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <h3 className="font-medium mb-4">Payments Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="paid" fill="#4ade80" />
            <Bar dataKey="pending" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}