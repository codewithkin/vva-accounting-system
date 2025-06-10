"use client";

import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field } from "formik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

interface StudentFormValues {
    name: string;
    class: string;
    contact: string;
    parentContact: string;
    fees: number; // <-- NEW: Add fees field
}

export default function NewStudentPage() {
    const mutation = useMutation({
        mutationFn: async (student: StudentFormValues) => {
            const res = await axios.post(`${process.env.NODE_ENV === "development"
                ? "http://localhost:8080"
                : "https://vva-server-0chny.kinsta.app"
                }/api/accounting/students/new`, student);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Student created successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || "Failed to create student");
        },
    });

    return (
        <div className="max-w-2xl mx-auto mt-10">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Student</CardTitle>
                </CardHeader>
                <CardContent>
                    <Formik<StudentFormValues>
                        initialValues={{
                            name: "",
                            class: "",
                            contact: "",
                            parentContact: "",
                            fees: 130, // <-- NEW: Set initial fees value (matching Prisma default)
                        }}
                        validate={(values) => {
                            const errors: Partial<Record<keyof StudentFormValues, string>> = {};
                            if (!values.name) errors.name = "Required";
                            if (!values.class) errors.class = "Required";
                            if (!values.contact || !/^\d{4,}$/.test(values.contact)) {
                                errors.contact = "Enter a valid number (e.g., 0772...)";
                            }
                            if (!values.parentContact || !/^\d{4,}$/.test(values.parentContact)) {
                                errors.parentContact = "Enter a valid number";
                            }
                            // <-- NEW: Validation for fees
                            if (values.fees === undefined || values.fees === null) {
                                errors.fees = "Required";
                            } else if (isNaN(values.fees) || values.fees <= 0) {
                                errors.fees = "Must be a positive number";
                            }
                            return errors;
                        }}
                        onSubmit={(values, { resetForm }) => {
                            mutation.mutate(values);
                            resetForm();
                        }}
                    >
                        {({ errors, touched, isSubmitting }) => (
                            <Form className="space-y-4">

                                <div>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Field as={Input} id="name" name="name" placeholder="Student Name" />
                                    {touched.name && errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="class">Class</Label>
                                    <Field as={Input} id="class" name="class" placeholder="Grade 6, Form 1, etc." />
                                    {touched.class && errors.class && (
                                        <p className="text-sm text-red-500">{errors.class}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="contact">Student Contact</Label>
                                    <Field
                                        as={Input}
                                        id="contact"
                                        name="contact"
                                        placeholder="0772XXXXXX"
                                    />
                                    {touched.contact && errors.contact && (
                                        <p className="text-sm text-red-500">{errors.contact}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="parentContact">Parent Contact</Label>
                                    <Field
                                        as={Input}
                                        id="parentContact"
                                        name="parentContact"
                                        placeholder="0772XXXXXX"
                                    />
                                    {touched.parentContact && errors.parentContact && (
                                        <p className="text-sm text-red-500">{errors.parentContact}</p>
                                    )}
                                </div>

                                {/* NEW FIELD: Fees */}
                                <div>
                                    <Label htmlFor="fees">Termly Fees ($)</Label>
                                    <Field
                                        as={Input}
                                        type="number"
                                        id="fees"
                                        name="fees"
                                        placeholder="e.g., 130"
                                    />
                                    {touched.fees && errors.fees && (
                                        <p className="text-sm text-red-500">{errors.fees}</p>
                                    )}
                                </div>

                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Creating..." : "Create Student"}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </CardContent>
            </Card>
        </div>
    );
}