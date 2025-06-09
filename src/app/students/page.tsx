"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { GraduationCap, Plus } from "lucide-react";
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
import { saveAs } from "file-saver";
import Link from "next/link";

interface Invoice {
    id: string;
    items: any;
    total: number;
    dueDate: string;
    status: string;
    payments: any[];
}

interface Student {
    id: string;
    name: string;
    admissionId: string;
    class: string;
    contact: string;
    parentContact: string;
    createdAt: string;
    invoices: Invoice[];
    uniforms: any[];
}

interface ApiResponse {
    success: boolean;
    data: Student[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const fetchStudents = async (page = 1, limit = 10): Promise<ApiResponse> => {
    const response = await axios.get(
        `${process.env.NODE_ENV === "development"
            ? "http://localhost:8080"
            : "https://vva-server-397iy.kinsta.app/"
        }/api/accounting/students/?page=${page}&limit=${limit}`
    );
    return response.data;
};

function getCurrentTerm(): { start: Date; end: Date } {
    const now = new Date();
    const year = now.getFullYear();
    if (now >= new Date(`${year}-01-14`) && now <= new Date(`${year}-04-10`)) {
        return { start: new Date(`${year}-01-14`), end: new Date(`${year}-04-10`) };
    } else if (now >= new Date(`${year}-05-13`) && now <= new Date(`${year}-08-07`)) {
        return { start: new Date(`${year}-05-13`), end: new Date(`${year}-08-07`) };
    } else {
        return { start: new Date(`${year}-09-09`), end: new Date(`${year}-12-01`) };
    }
}

function StudentsPage() {
    const [page, setPage] = React.useState(1);
    const [filter, setFilter] = React.useState<"all" | "paid" | "unpaid">("all");
    const limit = 10;
    const term = getCurrentTerm();

    const {
        data: studentsData,
        isLoading,
        isError,
        error,
    } = useQuery<ApiResponse>({
        queryKey: ["students", page],
        queryFn: () => fetchStudents(page, limit),
    });

    const filteredStudents = React.useMemo(() => {
        if (!studentsData?.data) return [];
        return studentsData.data.filter((student) => {
            const hasFeesInvoiceThisTerm = student.invoices.some((inv) => {
                const dueDate = new Date(inv.dueDate);
                return (
                    inv.items?.feeType === "Fees" &&
                    inv.status === "Paid" &&
                    dueDate >= term.start &&
                    dueDate <= term.end
                );
            });
            if (filter === "paid") return hasFeesInvoiceThisTerm;
            if (filter === "unpaid") return !hasFeesInvoiceThisTerm;
            return true;
        });
    }, [studentsData, filter, term]);

    const downloadCSV = () => {
        const csvContent = [
            ["Admission ID", "Name", "Class", "Contact", "Parent Contact"],
            ...filteredStudents.map((s) => [
                s.admissionId,
                s.name,
                s.class,
                s.contact,
                s.parentContact,
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `students-${filter}-term.csv`);
    };

    return (
        <div className="p-4">
            <article className="flex flex-col mb-4">
                <h1 className="text-2xl font-bold">Manage your students</h1>
                <p className="text-muted-foreground text-sm">
                    View and manage all students enrolled at Vumba View Academy
                </p>
                <Button className="md:w-fit" asChild>
                    <Link href="/students/new">
                        <span className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add student
                        </span>
                    </Link>
                </Button>
            </article>

            <div className="flex justify-between items-center mb-4">
                <div className="space-x-2">
                    <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
                    <Button variant={filter === "paid" ? "default" : "outline"} onClick={() => setFilter("paid")}>Paid This Term</Button>
                    <Button variant={filter === "unpaid" ? "default" : "outline"} onClick={() => setFilter("unpaid")}>Haven't paid this term</Button>
                </div>
                <Button variant="outline" onClick={downloadCSV}>Download CSV</Button>
            </div>

            <Card className="p-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <GraduationCap className="h-12 w-12 text-red-500" />
                        <p className="text-red-500">
                            Error: {error instanceof Error ? error.message : "Failed to load students"}
                        </p>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </div>
                ) : filteredStudents.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Admission ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Parent Contact</TableHead>
                                    <TableHead>Enrolled On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.admissionId}</TableCell>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.class}</TableCell>
                                        <TableCell>{student.contact}</TableCell>
                                        <TableCell>{student.parentContact}</TableCell>
                                        <TableCell>
                                            {new Date(student.createdAt).toLocaleDateString()}
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
                                    {Math.min(page * limit, studentsData.pagination.total)}
                                </strong>{" "}
                                of <strong>{studentsData.pagination.total}</strong> students
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
                                        page === studentsData.pagination.totalPages ||
                                        studentsData.pagination.totalPages === 0
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
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

export default StudentsPage;