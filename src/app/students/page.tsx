"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
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

interface Student {
    id: string;
    name: string;
    admissionId: string;
    class: string;
    contact: string;
    parentContact: string;
    createdAt: string;
    invoices: any[];
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

function StudentsPage() {
    const [page, setPage] = React.useState(1);
    const limit = 10;

    const {
        data: studentsData,
        isLoading,
        isError,
        error,
    } = useQuery<ApiResponse>({
        queryKey: ["students", page],
        queryFn: () => fetchStudents(page, limit),
    });

    return (
        <div className="p-4">
            <article className="flex flex-col mb-8">
                <h1 className="text-2xl font-bold">Manage your students</h1>
                <p className="text-muted-foreground text-sm">
                    View and manage all students enrolled at Vumba View Academy
                </p>
            </article>

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
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                ) : studentsData?.data && studentsData.data.length > 0 ? (
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
                                {studentsData.data.map((student) => (
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