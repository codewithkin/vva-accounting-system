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
    class: string;
    contact: string;
    parentContact: string;
    createdAt: string;
    invoices: Invoice[];
    uniforms: any[];
    arrears?: number;
}

interface ApiResponse {
    success: boolean;
    data: Student[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const getBaseUrl = () =>
    process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : process.env.BACKEND_URL;

const fetchStudentsByFilter = async (
    filter: "all" | "paid" | "unpaid",
    page: number,
    limit: number
): Promise<Student[] | ApiResponse> => {
    let url = `${getBaseUrl()}/api/accounting/students`;

    if (filter === "unpaid") {
        url = `${getBaseUrl()}/api/accounting/students/unpaid`;
        const response = await axios.get<Student[]>(url);
        return response.data;
    } else if (filter === "paid") {
        url = `${getBaseUrl()}/api/accounting/students/paid`;
        const response = await axios.get<Student[]>(url);
        return response.data;
    } else {
        url = `${getBaseUrl()}/api/accounting/students/?page=${page}&limit=${limit}`;
        const response = await axios.get<ApiResponse>(url);
        return response.data;
    }
};

function getCurrentTermForDisplay(): { start: Date; end: Date; name: string } {
    const now = new Date();
    const year = now.getFullYear();

    if (now >= new Date(`${year}-01-14`) && now <= new Date(`${year}-04-10`)) {
        return { start: new Date(`${year}-01-14`), end: new Date(`${year}-04-10`), name: "Term 1" };
    } else if (now >= new Date(`${year}-05-13`) && now <= new Date(`${year}-08-07`)) {
        return { start: new Date(`${year}-05-13`), end: new Date(`${year}-08-07`), name: "Term 2" };
    } else {
        return { start: new Date(`${year}-09-09`), end: new Date(`${year}-12-01`), name: "Term 3" };
    }
}

function StudentsPage() {
    const [page, setPage] = React.useState(1);
    const [filter, setFilter] = React.useState<"all" | "paid" | "unpaid">("all");
    const limit = 10;
    const termForDisplay = getCurrentTermForDisplay();

    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery<Student[] | ApiResponse>({
        queryKey: ["students", page, filter],
        queryFn: () => fetchStudentsByFilter(filter, page, limit)
    });

    const studentsList: Student[] = Array.isArray(data) ? data : (data?.data || []);
    const paginationInfo = !Array.isArray(data) ? data?.pagination : undefined;

    const downloadCSV = async () => {
        let studentsToExport: Student[] = [];
        if (filter === "all" && paginationInfo) {
            const allPagesPromises = [];
            for (let i = 1; i <= paginationInfo.totalPages; i++) {
                allPagesPromises.push(fetchStudentsByFilter(filter, i, paginationInfo.total));
            }
            const allResponses = await Promise.all(allPagesPromises);
            studentsToExport = allResponses.flatMap(res => (res as ApiResponse).data);
        } else {
            studentsToExport = studentsList;
            if (filter === "all") {
                const response = await fetchStudentsByFilter("all", 1, 1000000);
                studentsToExport = (response as ApiResponse).data;
            }
        }

        const csvContent = [
            ["Name", "Class", "Contact", "Parent Contact", "Arrears"],
            ...studentsToExport.map((s) => [
                s.name,
                s.class,
                s.contact,
                s.parentContact,
                filter === "unpaid" && s.arrears !== undefined ? `$${s.arrears.toFixed(2)}` : "N/A",
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `students-${filter}-${termForDisplay.name}.csv`);
    };

    return (
        <div className="p-4">
            <article className="flex flex-col mb-4">
                <h1 className="text-2xl font-bold">Manage your students</h1>
                <p className="text-muted-foreground text-sm">
                    View and manage all students enrolled at Vumba View Academy
                </p>
                <Button className="md:w-fit" asChild>
                    <Link href="/accounting/invoices/new">
                        <span className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Student
                        </span>
                    </Link>
                </Button>
            </article>

            <div className="flex justify-between items-center mb-4">
                <div className="space-x-2">
                    <Button variant={filter === "all" ? "default" : "outline"} onClick={() => { setFilter("all"); setPage(1); }}>All</Button>
                    <Button variant={filter === "paid" ? "default" : "outline"} onClick={() => { setFilter("paid"); setPage(1); }}>Paid This Term</Button>
                    <Button variant={filter === "unpaid" ? "default" : "outline"} onClick={() => { setFilter("unpaid"); setPage(1); }}>Unpaid This Term</Button>
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
                ) : studentsList.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Parent Contact</TableHead>
                                    <TableHead>Enrolled On</TableHead>
                                    {filter === "unpaid" && <TableHead>Arrears</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentsList.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.class}</TableCell>
                                        <TableCell>{student.contact}</TableCell>
                                        <TableCell>{student.parentContact}</TableCell>
                                        <TableCell>
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        {filter === "unpaid" && (
                                            <TableCell className="text-red-500 font-semibold">
                                                {student.arrears !== undefined ? `$${student.arrears.toFixed(2)}` : "N/A"}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {filter === "all" && paginationInfo && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing{" "}
                                    <strong>
                                        {(page - 1) * limit + 1}-
                                        {Math.min(page * limit, paginationInfo.total)}
                                    </strong>{" "}
                                    of <strong>{paginationInfo.total}</strong> students
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
                                            page === paginationInfo.totalPages ||
                                            paginationInfo.totalPages === 0
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <GraduationCap className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No students found for this filter.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default StudentsPage;