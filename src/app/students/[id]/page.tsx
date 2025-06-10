// src/app/students/[id]/page.tsx
// This is now a Server Component by default (no "use client")

// Removed client-side imports
// import { useParams } from "next/navigation";
// import { useQuery } from "@tanstack/react-query";
// import { useState, useMemo } from "react";
// All client-side logic is now in StudentDetailsClient.tsx

import axios from "axios"; // axios is still needed for generateStaticParams
import { StudentDetailsClient } from "./StudentDetailsClient"; // NEW: Import the client component

// --- Type Definitions (Needed for generateStaticParams and props) ---
// Define these here or import them from a shared types file
interface Student {
    id: string;
    name: string;
    // ... other student fields needed for generateStaticParams, though only 'id' is strictly necessary
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

// --- Helper Function for Base URL (Needed for generateStaticParams) ---
const getBaseUrl = () =>
    process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : "https://vva-server-0chny.kinsta.app";


// The default export for the page is now a Server Component
export default function StudentDetailPage({ params }: { params: { id: string } }) {
    // We pass the id from the server component's params to the client component
    const studentId = params.id;

    return (
        // Render the Client Component, passing the necessary props
        <StudentDetailsClient studentId={studentId} />
    );
}


// generateStaticParams function for static export (runs on server at build time)
export async function generateStaticParams() {
    try {
        const baseUrl = getBaseUrl(); // Reuse getBaseUrl

        // Fetch all students from your Express.js backend.
        // Request a large limit to get all students for static generation.
        const response = await axios.get<ApiResponse>(`${baseUrl}/api/accounting/students?limit=999999`);

        const students = response.data.data;

        // Return an array of objects for the dynamic segments
        return students.map((student) => ({
            id: student.id,
        }));
    } catch (error: any) {
        console.error("Failed to generate static params for students from backend:", error.message || error);
        // Crucial: Your backend must be running and accessible during `next build` for this to work.
        throw new Error(`Failed to fetch student IDs from backend during build: ${error.message || 'Unknown error'}`);
    }
}