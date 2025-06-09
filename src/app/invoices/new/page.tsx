"use client";

import React, { useState } from "react";
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
}

interface InvoiceItem {
    feeType: string;
    amount: number;
    description?: string;
}

const fetchStudents = async (): Promise<Student[]> => {
    const response = await axios.get(
        `${process.env.NODE_ENV === "development" ? "http://localhost:8080" : "https://vva-server-397iy.kinsta.app"}/api/accounting/students/`
    );
    return response.data.data;
};

const createInvoice = async (data: {
    studentId: string;
    items: InvoiceItem[];
    dueDate: Date;
    paymentMethod: string;
}) => {
    const response = await axios.post(
        `${process.env.NODE_ENV === "development"
            ? "http://localhost:8080"
            : process.env.BACKEND_URL
        }/api/accounting/invoices/new`,
        data
    );
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
    // New: State for the search query
    const [searchQuery, setSearchQuery] = useState<string>("");

    const { data: students, isLoading: isLoadingStudents } = useQuery({
        queryKey: ["students"],
        queryFn: fetchStudents,
    });

    // New: Filter students based on search query
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
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

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

        if (items.some(item => item.amount <= 0)) {
            toast.error("All items must have a positive amount");
            return;
        }

        mutation.mutate({
            studentId: selectedStudent,
            items,
            dueDate,
            paymentMethod,
        });
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
                                    disabled={isLoadingStudents}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* New: Search input for students */}
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
                                            // Display filtered students
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
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-5 space-y-2">
                                        <Label htmlFor={`feeType-${index}`}>Fee Type</Label>
                                        <Select
                                            value={item.feeType}
                                            onValueChange={(value) =>
                                                handleItemChange(index, "feeType", value)
                                            }
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

                                    <div className="md:col-span-4 space-y-2">
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
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor={`description-${index}`}>Description</Label>
                                        <Input
                                            id={`description-${index}`}
                                            value={item.description || ""}
                                            onChange={(e) =>
                                                handleItemChange(index, "description", e.target.value)
                                            }
                                            placeholder="Optional"
                                        />
                                    </div>

                                    <div className="md:col-span-1">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={items.length <= 1}
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
                                    ${calculateTotal().toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/invoices")}
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