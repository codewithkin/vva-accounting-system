"use client"; 
import { useStudentStore } from "@/stores/studentsStore";
import { GraduationCap } from "lucide-react"; // For the icon
import { StudentDetailsClient } from "./StudentDetailsClient";

// This component will be the new entry point for displaying selected student details
export default function StudentDetailsPageFromStore() {
    // Get the selectedStudentId from the Zustand store
    const selectedStudentId = useStudentStore((state) => state.selectedStudentId);

    // If no student is selected, display a message
    if (!selectedStudentId) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <GraduationCap className="h-24 w-24 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600 font-semibold">No student currently selected.</p>
                <p className="text-gray-500">Please go back to the Students list and select a student to view their details.</p>
            </div>
        );
    }

    // If a student is selected, render the StudentDetailsClient component
    // which will handle fetching and displaying the data.
    return (
        <StudentDetailsClient studentId={selectedStudentId} />
    );
}