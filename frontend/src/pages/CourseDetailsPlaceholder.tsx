import { Link, useParams } from 'react-router-dom'

export default function CourseDetailsPlaceholder() {
  const { id } = useParams<{ id: string }>()

  return (
    <main className="course-details-placeholder">
      <h1>Course Details</h1>
      <p>Course ID: {id}</p>
      <Link to="/dashboard">Back to dashboard</Link>
    </main>
  )
}
