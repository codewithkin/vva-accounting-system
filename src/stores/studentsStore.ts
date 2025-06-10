// src/store/studentStore.ts
import {create} from "zustand";

// Define the shape of your store's state
interface StudentState {
  selectedStudentId: string | null; // Stores the ID of the currently selected student
  setSelectedStudentId: (id: string | null) => void; // Function to update the selected student ID
}

// Create the Zustand store
export const useStudentStore = create<StudentState>((set) => ({
  selectedStudentId: null, // Initial state: no student selected
  setSelectedStudentId: (id) => set({selectedStudentId: id}), // Setter function
}));
