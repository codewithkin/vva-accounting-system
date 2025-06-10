"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Student {
    id: string;
    name: string;
    admissionId: string;
    class: string;
    parentContact?: string;
}

interface InvoiceItem {
    feeType: string;
    amount: number;
    description?: string;
}

interface CreditInvoice {
    id: string;
    total: number;
    dueDate: string;
    status: string;
    items: InvoiceItem[];
}

const getBaseUrl = () =>
    process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : process.env.BACKEND_URL;

const fetchStudents = async (): Promise<Student[]> => {
    const response = await axios.get(`${getBaseUrl()}/api/accounting/students/`);
    return response.data.data;
};

const fetchCreditInvoicesForStudent = async (studentId: string): Promise<CreditInvoice[]> => {
    const response = await axios.get(`${getBaseUrl()}/api/accounting/invoices/student/${studentId}/credit-outstanding`);
    return response.data.data;
};

const createInvoice = async (data: {
    studentId: string;
    items: InvoiceItem[];
    dueDate: Date;
    paymentMethod: string;
    amountDue?: number;
    linkedInvoiceId?: string;
}) => {
    const response = await axios.post(`${getBaseUrl()}/api/accounting/invoices/new`, data);
    return response.data;
};

const feeTypes = [
    "School Fees",
    "Uniform",
    "Practical Fees",
    "Holiday Lessons",
    "Trips",
    "Exam Fees",
    "Project Fees",
    "Other",
    "Fulfillment",
];

const paymentMethods = ["Card", "Ecocash", "Cash", "Credit"];

export default function CreateInvoicePage() {
    const router = useRouter();
    const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
    const [selectedStudent, setSelectedStudent] = useState<string>("");
    const [items, setItems] = useState<InvoiceItem[]>([
        { feeType: "School Fees", amount: 0 },
    ]);
    const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [amountDue, setAmountDue] = useState<number | undefined>(undefined);
    const [creditInvoices, setCreditInvoices] = useState<CreditInvoice[]>([]);
    const [selectedCreditInvoiceId, setSelectedCreditInvoiceId] = useState<string>("");

    const isCreditPayment = paymentMethod === "Credit";
    const isFulfillment = items.some(item => item.feeType === "Fulfillment");

    const { data: students, isLoading: isLoadingStudents } = useQuery({
        queryKey: ["students"],
        queryFn: fetchStudents,
    });

    const { data: fetchedCreditInvoices, isLoading: isLoadingCreditInvoices, refetch: refetchCreditInvoices } = useQuery<CreditInvoice[]>({
        queryKey: ["creditInvoices", selectedStudent],
        queryFn: () => fetchCreditInvoicesForStudent(selectedStudent),
        enabled: isFulfillment && !!selectedStudent,
    });

    useEffect(() => {
        if (fetchedCreditInvoices) {
            setCreditInvoices(fetchedCreditInvoices);
            if (fetchedCreditInvoices.length > 0 && !selectedCreditInvoiceId) {
                setSelectedCreditInvoiceId(fetchedCreditInvoices[0].id);
            }
        } else {
            setCreditInvoices([]);
            setSelectedCreditInvoiceId("");
        }
    }, [fetchedCreditInvoices, selectedCreditInvoiceId]);

    useEffect(() => {
        if (isFulfillment && selectedStudent) {
            refetchCreditInvoices();
        } else {
            setCreditInvoices([]);
            setSelectedCreditInvoiceId("");
        }
    }, [isFulfillment, selectedStudent, refetchCreditInvoices]);

    useEffect(() => {
        if (isCreditPayment) {
            setAmountDue(calculateTotal());
        } else {
            setAmountDue(undefined);
        }
    }, [items, isCreditPayment]);

    useEffect(() => {
        if (isFulfillment && selectedCreditInvoiceId) {
            const selectedInvoice = creditInvoices.find(inv => inv.id === selectedCreditInvoiceId);
            if (selectedInvoice) {
                const newItems = [...items];
                const fulfillmentItemIndex = newItems.findIndex(item => item.feeType === "Fulfillment");
                if (fulfillmentItemIndex !== -1) {
                    newItems[fulfillmentItemIndex].amount = selectedInvoice.total;
                    setItems(newItems);
                }
            }
        }
    }, [selectedCreditInvoiceId, creditInvoices, isFulfillment]);

    const filteredStudents = students?.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admissionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const mutation = useMutation({
        mutationFn: createInvoice,
        onSuccess: () => {
            toast.success("The invoice has been successfully created.");
            router.push("/invoices");
        },
        onError: (error: any) => {
            console.error("Invoice creation error:", error);
            toast.error(error.response?.data?.error || "Failed to create invoice");
        },
    });

    const handleAddItem = () => {
        setItems([...items, { feeType: "School Fees", amount: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === "feeType" && value === "Fulfillment") {
            newItems[index].amount = 0;
            setSelectedCreditInvoiceId("");
        }
        setItems(newItems);
    };

    function calculateTotal() {
        return items.reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStudent) {
            toast.error("Please select a student");
            return;
        }

        if (!dueDate) {
            toast.error("Please select a due date");
            return;
        }

        if (items.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        if (items.some(item => item.amount <= 0 && item.feeType !== "Fulfillment")) {
            toast.error("All non-fulfillment items must have a positive amount");
            return;
        }

        if (isFulfillment) {
            if (!selectedCreditInvoiceId) {
                toast.error("Please select a credit invoice to fulfill.");
                return;
            }
            const selectedInvoice = creditInvoices.find(inv => inv.id === selectedCreditInvoiceId);
            if (!selectedInvoice || items.some(item => item.feeType === "Fulfillment" && item.amount !== selectedInvoice.total)) {
                toast.error("Fulfillment amount must match the selected credit invoice total.");
                return;
            }
        }

        const invoiceData = {
            studentId: selectedStudent,
            items,
            dueDate,
            paymentMethod,
            ...(isCreditPayment && { amountDue: calculateTotal() }),
            ...(isFulfillment && { linkedInvoiceId: selectedCreditInvoiceId }),
        };

        mutation.mutate(invoiceData);
    };

    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Student Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="student">Student</Label>
                                <Select
                                    value={selectedStudent}
                                    onValueChange={setSelectedStudent}
                                    disabled={isLoadingStudents || mutation.isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="px-2 py-1">
                                            <Input
                                                placeholder="Search student by name, ID or class..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        {isLoadingStudents ? (
                                            <SelectItem value="loading" disabled>
                                                Loading students...
                                            </SelectItem>
                                        ) : filteredStudents.length === 0 ? (
                                            <SelectItem value="no-results" disabled>
                                                No students found.
                                            </SelectItem>
                                        ) : (
                                            filteredStudents.map((student) => (
                                                <SelectItem key={student.id} value={student.id}>
                                                    {student.name} ({student.admissionId}) - {student.class}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dueDate && "text-muted-foreground"
                                            )}
                                            disabled={mutation.isPending}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dueDate}
                                            onSelect={setDueDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={setPaymentMethod}
                                    disabled={mutation.isPending || isFulfillment}
                                >
                                    <SelectTrigger id="paymentMethod">
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((method) => (
                                            <SelectItem key={method} value={method}>
                                                {method}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount Due - Only for Credit Payment */}
                            {isCreditPayment && (
                                <div className="space-y-2">
                                    <Label htmlFor="amountDue">Amount Due</Label>
                                    <Input
                                        id="amountDue"
                                        type="number"
                                        value={amountDue !== undefined ? amountDue.toFixed(2) : ""}
                                        readOnly
                                        className="bg-gray-100 dark:bg-gray-800"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Invoice Items */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>Invoice Items</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddItem}
                                    disabled={mutation.isPending || isFulfillment}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-4 space-y-2">
                                        <Label htmlFor={`feeType-${index}`}>Fee Type</Label>
                                        <Select
                                            value={item.feeType}
                                            onValueChange={(value) =>
                                                handleItemChange(index, "feeType", value)
                                            }
                                            disabled={mutation.isPending}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select fee type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {feeTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {item.feeType === "Fulfillment" && (
                                        <div className="md:col-span-5 space-y-2">
                                            <Label htmlFor={`creditInvoice-${index}`}>Credit Invoice</Label>
                                            <Select
                                                value={selectedCreditInvoiceId}
                                                onValueChange={setSelectedCreditInvoiceId}
                                                disabled={mutation.isPending || !selectedStudent || creditInvoices.length === 0 || isLoadingCreditInvoices}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select credit invoice" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {isLoadingCreditInvoices ? (
                                                        <SelectItem value="loading" disabled>
                                                            Loading outstanding invoices...
                                                        </SelectItem>
                                                    ) : creditInvoices.length === 0 ? (
                                                        <SelectItem value="no-credit-invoices" disabled>
                                                            No outstanding credit invoices
                                                        </SelectItem>
                                                    ) : (
                                                        creditInvoices.map((inv) => (
                                                            <SelectItem key={inv.id} value={inv.id}>
                                                                Invoice ID: {inv.id.substring(0, 6)}... (Due: {format(new Date(inv.dueDate), "PPP")}, Total: ${inv.total.toFixed(2)})
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className={`space-y-2 ${item.feeType === "Fulfillment" ? "md:col-span-2" : "md:col-span-5"}`}>
                                        <Label htmlFor={`amount-${index}`}>Amount</Label>
                                        <Input
                                            id={`amount-${index}`}
                                            type="number"
                                            value={item.amount}
                                            onChange={(e) =>
                                                handleItemChange(index, "amount", parseFloat(e.target.value))
                                            }
                                            min="0"
                                            step="0.01"
                                            disabled={mutation.isPending || item.feeType === "Fulfillment"}
                                            className={item.feeType === "Fulfillment" ? "bg-gray-100 dark:bg-gray-800" : ""}
                                        />
                                    </div>

                                    <div className="md:col-span-1">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={items.length <= 1 || mutation.isPending || isFulfillment}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="flex justify-end">
                            <div className="space-y-2">
                                <Label>Total Amount</Label>
                                <div className="text-2xl font-bold">
                                    ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/invoices")}
                                disabled={mutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Creating..." : "Create Invoice"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}