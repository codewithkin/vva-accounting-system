"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

function RecentStudents() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["recent-students"],
        queryFn: async () => {
            const response = await axios.get(`${process.env.NODE_ENV === "development"
                ? "http://localhost:8080"
                : "https://vva-server-397iy.kinsta.app/"
                }/api/accounting/students/`);
            return response.data;
        },
    });

    return (
        <Card className="mt-6 p-4">
            <h3 className="font-medium mb-4">Recent Students</h3>
            {isLoading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-200 rounded-full p-2 animate-pulse h-10 w-10" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : isError ? (
                <div className="text-red-500 text-center py-4">
                    Failed to load recent students
                </div>
            ) : data?.data && data.data.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {data.data.map((student: any) => (
                        <Card key={student.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <GraduationCap className="text-blue-600 w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium">{student.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {student.admissionId}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <GraduationCap className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No students found</p>
                </div>
            )}
        </Card>
    );
}

export default RecentStudents;