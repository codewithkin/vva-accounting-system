// src/app/students/[id]/StudentDetailsClient.tsx
// (No changes needed to the content of this file from the previous version)

"use client"; // Marks this as a Client Component

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";

// --- Type Definitions (Match your Prisma models closely) ---
interface Payment {
    id: string;
    amount: number;
    method: string;
    date: string; // Assuming ISO string from backend
    createdAt: string;
}

interface InvoiceItem {
    feeType: string;
    amount: number;
    description?: string;
}

interface Invoice {
    id: string;
    studentId: string;
    items: InvoiceItem[];
    total: number;
    createdAt: string;
    dueDate: string;
    status: string;
    payments: Payment[];
}

interface Student {
    id: string;
    name: string;
    class: string;
    contact: string;
    parentContact: string;
    fees: number;
    createdAt: string;
    invoices: Invoice[];
    uniforms: any[];
}

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZW", {
        style: "currency",
        currency: "USD",
    }).format(amount);
};

const getBaseUrl = () =>
    process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : "https://vva-server-0chny.kinsta.app";

// --- Term Definitions ---
const getTerms = (year: number) => [
    { name: "Term 1", start: new Date(`${year}-01-14`), end: new Date(`${year}-04-10`) },
    { name: "Term 2", start: new Date(`${year}-05-13`), end: new Date(`${year}-08-07`) },
    { name: "Term 3", start: new Date(`${year}-09-09`), end: new Date(`${year}-12-01`) },
];

// Define props for the Client Component
interface StudentDetailsClientProps {
    studentId: string; // The ID passed from the Server Component
}

export function StudentDetailsClient({ studentId }: StudentDetailsClientProps) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const [selectedTerm, setSelectedTerm] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    const {
        data: studentData,
        isLoading,
        isError,
        error,
    } = useQuery<Student, Error>({
        queryKey: ["student", studentId],
        queryFn: async () => {
            // Fetch student details from your backend using the studentId
            const res = await axios.get(`${getBaseUrl()}/api/accounting/students/${studentId}`);
            const student: Student = {
                ...res.data.data,
                invoices: res.data.data.invoices.map((invoice: Invoice) => ({
                    ...invoice,
                    items: invoice.items as InvoiceItem[],
                })),
            };
            return student;
        },
        // The query is enabled only when studentId is available
        enabled: !!studentId,
        // Add a staleTime if you want to avoid re-fetching on every focus
        // staleTime: 1000 * 60 * 5, // 5 minutes
    });

    console.log("Client Component - Student ID prop:", studentId);


    // Calculate allInvoices and schoolFeesInvoices using useMemo.
    // Ensure studentData is safely accessed for these calculations if it can be undefined initially.
    const allInvoices = studentData?.invoices || [];

    const schoolFeesInvoices = useMemo(() => {
        let filteredInvoices = allInvoices.filter(
            (invoice) =>
                (invoice.items && Array.isArray(invoice.items) && invoice.items.some(item => item.feeType === "School Fees"))
        );

        const termsForSelectedYear = getTerms(selectedYear);

        if (selectedTerm !== "all") {
            const term = termsForSelectedYear.find(t => t.name === selectedTerm);
            if (term) {
                filteredInvoices = filteredInvoices.filter(invoice => {
                    const invoiceDate = new Date(invoice.createdAt);
                    return invoiceDate >= term.start && invoiceDate <= term.end;
                });
            }
        }

        return filteredInvoices;
    }, [allInvoices, selectedTerm, selectedYear]);

    // --- CONDITIONAL RETURNS (AFTER ALL HOOKS ARE CALLED) ---
    if (isLoading) {
        return <div className="p-8 text-center">Loading student details...</div>;
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-red-600">
                Error loading student: {error?.message || "Unknown error"}
            </div>
        );
    }

    if (!studentData) {
        // This case might occur if studentId is not valid or no data is returned
        return <div className="p-8 text-center">Student not found or invalid ID.</div>;
    }

    // --- REST OF THE COMPONENT RENDERING LOGIC ---
    // These calculations can safely run here, as studentData is guaranteed to exist
    // if we reach this point.
    const grandTotal = allInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const schoolFeesTotal = schoolFeesInvoices.reduce((sum, invoice) => sum + invoice.total, 0);


    return (
        <div className="p-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Student Details</CardTitle>
                    <CardDescription>Information about {studentData.name}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <strong>Full Name:</strong> {studentData.name}
                    </div>
                    <div>
                        <strong>Class:</strong> {studentData.class}
                    </div>
                    <div>
                        <strong>Contact:</strong> {studentData.contact}
                    </div>
                    <div>
                        <strong>Parent Contact:</strong> {studentData.parentContact}
                    </div>
                    <div>
                        <strong>Default Termly Fees:</strong> {formatCurrency(studentData.fees)}
                    </div>
                    <div>
                        <strong>Admission Date:</strong>{" "}
                        {format(new Date(studentData.createdAt), "PPP")}
                    </div>
                </CardContent>
            </Card>

            {/* Table 1: All Invoices */}
            <Card>
                <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    {allInvoices.length === 0 ? (
                        <p className="text-center text-gray-500">No invoices found for this student.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payments Made</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allInvoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">{invoice.id.substring(0, 8)}...</TableCell>
                                            <TableCell>{format(new Date(invoice.createdAt), "PPP")}</TableCell>
                                            <TableCell>{format(new Date(invoice.dueDate), "PPP")}</TableCell>
                                            <TableCell>
                                                {invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0 ? (
                                                    invoice.items.map((item, index) => (
                                                        <div key={index}>
                                                            {item.feeType} ({formatCurrency(item.amount)})
                                                        </div>
                                                    ))
                                                ) : (
                                                    "N/A"
                                                )}
                                            </TableCell>
                                            <TableCell>{formatCurrency(invoice.total)}</TableCell>
                                            <TableCell>
                                                <Badge variant={invoice.status === "Paid" ? "default" : "destructive"}>
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {invoice.payments && invoice.payments.length > 0 ? (
                                                    invoice.payments.map((payment, index) => (
                                                        <div key={payment.id}>
                                                            {formatCurrency(payment.amount)} ({payment.method})
                                                        </div>
                                                    ))
                                                ) : (
                                                    "No Payments"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="w-full">
                    <CardDescription className="w-full justify-between items-center flex">
                        Grand Total:{" "}
                        <span className="font-bold text-lg">
                            {formatCurrency(grandTotal)}
                        </span>
                    </CardDescription>
                </CardFooter>
            </Card>

            {/* Table 2: School Fees Invoices */}
            <Card>
                <CardHeader>
                    <CardTitle>School Fees Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="flex-1">
                            <Label htmlFor="year-filter">Filter by Year</Label>
                            <Select
                                value={String(selectedYear)}
                                onValueChange={(value) => setSelectedYear(parseInt(value))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={String(year)}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="term-filter">Filter by Term</Label>
                            <Select
                                value={selectedTerm}
                                onValueChange={(value) => setSelectedTerm(value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Terms</SelectItem>
                                    {getTerms(selectedYear).map((term) => (
                                        <SelectItem key={term.name} value={term.name}>
                                            {term.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {schoolFeesInvoices.length === 0 ? (
                        <p className="text-center text-gray-500">No school fees invoices found for the selected filters.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payments Made</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schoolFeesInvoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">{invoice.id.substring(0, 8)}...</TableCell>
                                            <TableCell>{format(new Date(invoice.createdAt), "PPP")}</TableCell>
                                            <TableCell>{format(new Date(invoice.dueDate), "PPP")}</TableCell>
                                            <TableCell>{formatCurrency(invoice.total)}</TableCell>
                                            <TableCell>
                                                <Badge variant={invoice.status === "Paid" ? "default" : "destructive"}>
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {invoice.payments && invoice.payments.length > 0 ? (
                                                    invoice.payments.map((payment, index) => (
                                                        <div key={payment.id}>
                                                            {formatCurrency(payment.amount)} ({payment.method})
                                                        </div>
                                                    ))
                                                ) : (
                                                    "No Payments"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <CardDescription className="w-full justify-between items-center flex">
                        Total for filtered fees:{" "}
                        <span className="font-bold text-lg">
                            {formatCurrency(schoolFeesTotal)}
                        </span>
                    </CardDescription>
                </CardFooter>
            </Card>
        </div>
    );
}