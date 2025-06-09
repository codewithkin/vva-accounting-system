"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { FileText, Loader2, AlertCircle, RefreshCw, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { saveAs } from "file-saver";

interface Invoice {
    id: string;
    studentId: string;
    items: {
        name: string;
        amount: number;
    }[];
    total: number;
    dueDate: string;
    status: "Pending" | "Paid" | "Overdue";
    createdAt: string;
    student: {
        name: string;
        admissionId: string;
    };
    payments: {
        amount: number;
        date: string;
        method: string;
    }[];
}

interface ApiResponse {
    success: boolean;
    data: Invoice[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const fetchInvoices = async (page = 1, limit = 10, status?: string): Promise<ApiResponse> => {
    const url = `${process.env.NODE_ENV === "development" ? "http://localhost:8080" : "https://vva-server-397iy.kinsta.app"}/api/accounting/invoices/?page=${page}&limit=${limit}${status ? `&status=${status}` : ""
        }`;
    const response = await axios.get(url);
    return response.data;
};

function InvoicesPage() {
    const [page, setPage] = React.useState(1);
    const [statusFilter, setStatusFilter] = React.useState<string | undefined>();
    const limit = 10;

    const {
        data: invoicesData,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<ApiResponse>({
        queryKey: ["invoices", page, statusFilter],
        queryFn: () => fetchInvoices(page, limit, statusFilter)
    });

    const handleDownloadCSV = async () => {
        try {
            // Fetch all invoices with current filters (no pagination)
            const response = await axios.get(
                `${process.env.NODE_ENV === "development" ? "http://localhost:8080" : "https://vva-server-397iy.kinsta.app"}/api/accounting/invoices/?limit=0${statusFilter ? `&status=${statusFilter}` : ""}`
            );

            const data = response.data.data;

            if (!data || data.length === 0) {
                alert("No invoices to download");
                return;
            }

            // Create CSV headers
            const headers = [
                "Invoice ID",
                "Student Name",
                "Student ID",
                "Items",
                "Total Amount",
                "Due Date",
                "Status",
                "Created At"
            ].join(",");

            // Create CSV rows
            const rows = data.map((invoice: Invoice) => {
                const itemsString = invoice.items
                    .map(item => `${item.name} ($${item.amount})`)
                    .join("; ");

                return [
                    `INV-${invoice.id.slice(0, 8)}`,
                    `"${invoice.student.name}"`,
                    invoice.student.admissionId,
                    `"${itemsString}"`,
                    invoice.total,
                    format(new Date(invoice.dueDate), "yyyy-MM-dd"),
                    invoice.status,
                    format(new Date(invoice.createdAt), "yyyy-MM-dd")
                ].join(",");
            });

            // Combine headers and rows
            const csvContent = [headers, ...rows].join("\n");

            // Create a blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const filename = `Vumba_Invoices_${statusFilter || "All"}_${format(new Date(), "yyyyMMdd")}.csv`;
            saveAs(blob, filename);

        } catch (error) {
            console.error("Error downloading CSV:", error);
            alert("Failed to download invoices. Please try again.");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Paid":
                return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
            case "Overdue":
                return <Badge className="bg-red-500 hover:bg-red-600">{status}</Badge>;
            default:
                return <Badge className="bg-amber-500 hover:bg-amber-600">{status}</Badge>;
        }
    };

    return (
        <div className="p-4">
            <article className="flex flex-col mb-8">
                <h1 className="text-2xl font-bold">Vumba View Academy Invoices</h1>
                <p className="text-muted-foreground text-sm">
                    Manage and track all school invoices
                </p>
            </article>

            <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <Select
                            value={statusFilter || "all"}
                            onValueChange={(value) => {
                                setStatusFilter(value === "all" ? undefined : value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Invoices</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={handleDownloadCSV}
                            disabled={isLoading || (invoicesData?.pagination.total === 0)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                        <p className="text-red-500">
                            Error: {error instanceof Error ? error.message : "Failed to load invoices"}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                ) : invoicesData?.data && invoicesData.data.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoicesData.data.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">INV-{invoice.id.slice(0, 8)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{invoice.student.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {invoice.student.admissionId}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {invoice.items.map((item, index) => (
                                                    <span key={index} className="text-sm">
                                                        {item.name} (${item.amount})
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>${invoice.total.toLocaleString()}</TableCell>
                                        <TableCell>
                                            {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing{" "}
                                <strong>
                                    {(page - 1) * limit + 1}-
                                    {Math.min(page * limit, invoicesData.pagination.total)}
                                </strong>{" "}
                                of <strong>{invoicesData.pagination.total}</strong> invoices
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((old) => Math.max(old - 1, 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((old) => old + 1)}
                                    disabled={
                                        page === invoicesData.pagination.totalPages ||
                                        invoicesData.pagination.totalPages === 0
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No invoices found</p>
                        {statusFilter && (
                            <Button
                                variant="outline"
                                onClick={() => setStatusFilter(undefined)}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}

export default InvoicesPage;