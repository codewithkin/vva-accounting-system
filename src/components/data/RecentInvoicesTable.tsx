import { GraduationCap } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Card } from "../ui/card";

function RecentInvoicesTable({ data }: { data: any }) {
    const invoices = data?.invoices ?? [];
    const hasInvoices = invoices.length > 0;

    return (
        <Card className="mt-6 p-4">
            <h3 className="font-medium mb-4">Recent Invoices</h3>
            <Table>
                <TableHeader className="bg-gray-300 rounded-lg">
                    <TableRow>
                        <TableHead className="w-12 py-4 px-3 rounded-l-lg"></TableHead>
                        <TableHead className="py-4 px-3">Student Name</TableHead>
                        <TableHead className="py-4 px-3">Admission ID</TableHead>
                        <TableHead className="py-4 px-3">Total</TableHead>
                        <TableHead className="py-4 px-3">Status</TableHead>
                        <TableHead className="py-4 px-3 rounded-r-lg">Due Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {hasInvoices ? (
                        invoices.slice(0, 6).map((invoice: any) => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    <div className="bg-blue-100 p-2 rounded-full w-fit">
                                        <GraduationCap className="text-blue-600 w-5 h-5" />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {invoice.student?.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {invoice.student?.admissionId}
                                </TableCell>
                                <TableCell>
                                    ${invoice.total?.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    {invoice.status}
                                </TableCell>
                                <TableCell>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                No invoices yet
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

export default RecentInvoicesTable;
