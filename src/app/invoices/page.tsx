"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
    FileText,
    Loader2,
    AlertCircle,
    RefreshCw,
    Download,
    Plus,
    Trash2, // Added for delete icon
    FileDown, // Added for PDF download icon
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Added useQueryClient
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
import Link from "next/link";
import { toast } from "sonner"; // Assuming you have sonner for toasts
import html2canvas from 'html2canvas'; // For PDF generation
import jsPDF from 'jspdf'; // For PDF generation

interface Invoice {
    id: string;
    invoiceNumber: string; // Assuming your backend provides this
    studentId: string;
    items: {
        name: string;
        amount: number;
        description?: string; // Added for completeness if present
    }[];
    total: number;
    dueDate: string;
    status: "Pending" | "Paid" | "Overdue";
    createdAt: string;
    student: {
        name: string;
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

// Function to fetch invoices
const fetchInvoices = async (page = 1, limit = 10, status?: string): Promise<ApiResponse> => {
    const url = `${process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : "https://vva-server-0chny.kinsta.app"
        }/api/accounting/invoices/?page=${page}&limit=${limit}${status ? `&status=${status}` : ""
        }`;
    const response = await axios.get(url);
    return response.data;
};

// Function to delete an invoice
const deleteInvoice = async (invoiceId: string) => {
    const url = `${process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : "https://vva-server-0chny.kinsta.app"
        }/api/accounting/invoices/${invoiceId}`;
    await axios.delete(url);
};

function InvoicesPage() {
    const queryClient = useQueryClient(); // Initialize query client
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

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: deleteInvoice,
        onSuccess: () => {
            toast.success("Invoice deleted successfully!");
            // Invalidate and refetch data to update the list
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
        onError: (err: any) => {
            console.error("Error deleting invoice:", err);
            toast.error(err.response?.data?.error || "Failed to delete invoice.");
        },
    });

    const handleDeleteInvoice = (invoiceId: string) => {
        if (window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
            deleteMutation.mutate(invoiceId);
        }
    };

    const handleDownloadCSV = async () => {
        try {
            // Fetch all invoices with current filters (no pagination)
            const response = await axios.get(
                `${process.env.NODE_ENV === "development"
                    ? "http://localhost:8080"
                    : "https://vva-server-0chny.kinsta.app"
                }/api/accounting/invoices/?limit=0${statusFilter ? `&status=${statusFilter}` : ""}`
            );

            const data = response.data.data;

            if (!data || data.length === 0) {
                toast.info("No invoices to download based on current filters.");
                return;
            }

            // Create CSV headers
            const headers = [
                "Invoice ID",
                "Student Name",
                "Student Admission ID", // Added student admission ID
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

                // Ensure data is properly quoted for CSV
                return [
                    `INV-${invoice.invoiceNumber || invoice.id.slice(0, 8)}`, // Use invoiceNumber if available
                    `"${invoice.student.name}"`,
                    `"${itemsString}"`,
                    invoice.total,
                    format(new Date(invoice.dueDate), "yyyy-MM-dd"),
                    invoice.status,
                    format(new Date(invoice.createdAt), "yyyy-MM-dd")
                ].map(field => {
                    // Escape double quotes within fields if they contain them
                    if (typeof field === 'string' && field.includes(',')) {
                        return `"${field.replace(/"/g, '""')}"`;
                    }
                    return field;
                }).join(",");
            });

            // Combine headers and rows
            const csvContent = [headers, ...rows].join("\n");

            // Create a blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const filename = `Vumba_Invoices_${statusFilter || "All"}_${format(new Date(), "yyyyMMdd")}.csv`;
            saveAs(blob, filename);
            toast.success("CSV downloaded successfully!");

        } catch (error) {
            console.error("Error downloading CSV:", error);
            toast.error("Failed to download invoices CSV. Please try again.");
        }
    };

    const handleDownloadPDF = async (invoice: Invoice) => {
        // --- IMPORTANT: This is a simplified client-side PDF generation. ---
        // For a full, well-formatted invoice PDF, you usually have two better options:
        // 1. **Navigate to a dedicated invoice page:** Render the full invoice HTML
        //    on a route like `/invoices/${invoice.id}/view`, then use `html2canvas`
        //    and `jspdf` on that page.
        // 2. **Backend PDF Generation:** Have your backend API generate the PDF
        //    (e.g., using a library like Puppeteer or a dedicated PDF library in Rust/Go/Node.js)
        //    and return the PDF file, which you then download. This is generally more robust.

        toast.info("Generating PDF... This might take a moment.");

        // For demonstration, let's create a minimal HTML string for the PDF.
        // In a real app, you'd likely render a proper component or fetch dedicated PDF data.
        const invoiceHtmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 15px rgba(0,0,0,0.1);">
          <h1 style="text-align: center; color: #2c3e50;">Vumba View Academy</h1>
          <p style="text-align: center; color: #7f8c8d; margin-top: -10px;">Private School - Mutare, Zimbabwe<br>Email: info@vumbaacademy.com</p>
          <hr style="margin: 30px 0; border: none; border-top: 2px solid #ddd;">
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h3 style="margin-bottom: 5px;">Billed To:</h3>
              <p>
                <strong>${invoice.student.name}</strong><br>
                Class: ${invoice.student.class}<br>
                Student Contact: ${invoice.student.contact}<br>
              </p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin-bottom: 5px;">Invoice Details:</h3>
              <p>
                Invoice #: <strong>${invoice.invoiceNumber || invoice.id.slice(0, 8)}</strong><br>
                Issue Date: ${format(new Date(invoice.createdAt), "PPP")}<br>
                Due Date: ${format(new Date(invoice.dueDate), "PPP")}<br>
                Status: <strong style="color: ${invoice.status === 'Paid' ? '#27ae60' : invoice.status === 'Pending' ? '#e67e22' : '#c0392b'}">${invoice.status}</strong>
              </p>
            </div>
          </div>
      
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Fee Type</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${item.feeType}${item.description ? ` - ${item.description}` : ''}</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8f8f8;">
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Total</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">$${invoice.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
      
          ${invoice.payments?.length ? `
            <h4 style="margin-top: 30px;">Payment History</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Method</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.payments.map(payment => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${format(new Date(payment.date), "PPP")}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${payment.method}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${payment.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
      
          <div style="text-align: center; font-size: 0.9em; color: #888; margin-top: 40px;">
            Thank you for choosing Vumba View Academy. We value your continued support.
          </div>
        </div>
      `;


        try {
            // Create a temporary div to render the HTML content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = invoiceHtmlContent;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px'; // Position off-screen
            document.body.appendChild(tempDiv);

            // Use html2canvas to render the div content as an image
            const canvas = await html2canvas(tempDiv, { scale: 2 }); // Scale up for better quality
            const imgData = canvas.toDataURL('image/png');

            // Remove the temporary div
            document.body.removeChild(tempDiv);

            // Initialize jsPDF
            const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const filename = `Invoice_${invoice.invoiceNumber || invoice.id.slice(0, 8)}.pdf`;
            pdf.save(filename);
            toast.success("Invoice PDF downloaded successfully!");

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate invoice PDF. Please try again.");
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
            <article className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Vumba View Academy Invoices</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage and track all school invoices
                    </p>
                </div>
                <Button className="md:w-fit mt-4 md:mt-0" asChild>
                    <Link href="/invoices/new">
                        <span className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            New invoice
                        </span>
                    </Link>
                </Button>
            </article>

            <Card className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                    <div className="flex gap-2 w-full md:w-auto">
                        <Select
                            value={statusFilter || "all"}
                            onValueChange={(value) => {
                                setStatusFilter(value === "all" ? undefined : value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-[180px]">
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
                            className="w-full md:w-auto"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => refetch()} className="w-full md:w-auto">
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
                                    <TableHead className="text-right">Actions</TableHead> {/* New header */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoicesData.data.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">INV-{invoice.invoiceNumber || invoice.id.slice(0, 8)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{invoice.student.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {invoice.items.map((item, index) => (
                                                    <span key={index} className="text-sm">
                                                        {item.name} (${item.amount.toLocaleString()})
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>${invoice.total.toLocaleString()}</TableCell>
                                        <TableCell>
                                            {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownloadPDF(invoice)}
                                                    title="Download PDF"
                                                >
                                                    <FileDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                                    disabled={deleteMutation.isPending} // Disable while deleting
                                                    title="Delete Invoice"
                                                >
                                                    {deleteMutation.isPending && deleteMutation.variables === invoice.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
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