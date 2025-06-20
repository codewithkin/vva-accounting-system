import { BanknoteArrowDown, GraduationCap } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Card } from "../ui/card";
import { formatDistanceToNow } from "date-fns";

function RecentInvoicesTable({ data }: { data: any }) {
    const invoices = data?.invoices ?? [];
    const hasInvoices = invoices.length > 0;

    return (
        <Card className="mt-6 p-4">
            <h3 className="font-medium mb-4">Recent Invoices</h3>
            {
                data.invoices && data.invoices.length > 0 ?
                    <Table>
                        <TableHeader className="bg-gray-300 rounded-lg">
                            <TableRow>
                                <TableHead className="w-12 py-4 px-3 rounded-l-lg"></TableHead>
                                <TableHead className="py-4 px-3">Student Name</TableHead>
                                <TableHead className="py-4 px-3">Amount</TableHead>
                                <TableHead className="py-4 px-3">Status</TableHead>
                                <TableHead className="py-4 px-3 rounded-r-lg">Date</TableHead>
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
                                        <TableCell>
                                            ${invoice.total?.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {invoice.status}
                                        </TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(invoice.dueDate))} ago
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

                    : (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <BanknoteArrowDown className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No invoices yet</p>
                        </div>
                    )}
        </Card>
    );
}

export default RecentInvoicesTable;
