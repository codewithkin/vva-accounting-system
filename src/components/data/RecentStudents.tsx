import React from 'react'
import { Card } from '../ui/card'
import { GraduationCap } from 'lucide-react'

function RecentStudents({data}: {data: any}) {
    return (
        <Card className="mt-6 p-4">
            <h3 className="font-medium mb-4">Recent Students</h3>
            {data?.students && data.students.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {data.students.slice(0, 6).map((student: any) => (
                        <Card
                            key={student.id}
                            className="p-4 hover:shadow-md transition-shadow"
                        >
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
    )
}

export default RecentStudents
