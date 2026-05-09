import { useState, useEffect } from 'react'
import { authStore } from '../store/authStore'
import { getCourses, searchCourses, type CourseResponse } from '../features/courses/api/courseApi'
import { getSections } from '../features/sections/api/sectionApi'

interface UseCoursesResult {
  courses: CourseResponse[]
  sectionCounts: Record<string, number>
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const createSectionCountMap = (courseIds: string[], sectionCourseIds: string[]) => {
  const map: Record<string, number> = {}
  for (const courseId of courseIds) {
    map[courseId] = 0
  }
  for (const courseId of sectionCourseIds) {
    if (map[courseId] !== undefined) {
      map[courseId] += 1
    }
  }
  return map
}

export const useCourses = (searchQuery: string = ''): UseCoursesResult => {
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const user = authStore.getUser()
  const role = user?.role
  const userId = user?.id

  useEffect(() => {
    let isActive = true

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const trimmedQuery = searchQuery.trim()
        
        // 1. Fetch sections (we'll need them for counts anyway, and filtering for instructors)
        const allSections = await getSections()
        
        // 2. Fetch courses based on search
        const allCourseResults = await (trimmedQuery ? searchCourses(trimmedQuery) : getCourses())

        if (!isActive) return

        let finalCourses = allCourseResults
        let relevantSections = allSections

        if (role === 'instructor') {
          // Filter sections by instructor_id
          relevantSections = allSections.filter(
            (section) => String(section.instructor_id) === String(userId)
          )
          
          // Get course IDs for these sections
          const instructorCourseIds = new Set(relevantSections.map((s) => s.course_id))
          
          // Filter courses to only show those that have sections for this instructor
          finalCourses = allCourseResults.filter((course) => instructorCourseIds.has(course.id))
        }

        setCourses(finalCourses)
        
        // For section counts, if admin, show all sections counts. 
        // If instructor, the prompt says "showing only those courses" based on sections.
        // It's ambiguous if the count should be total sections or just instructor's sections.
        // Usually, on a dashboard, instructors want to see their sections.
        // But the previous code just showed all sections count for all courses.
        // I'll stick to showing counts for relevantSections.
        
        const courseIds = finalCourses.map((c) => c.id)
        const sectionCourseIds = relevantSections.map((s) => s.course_id)
        setSectionCounts(createSectionCountMap(courseIds, sectionCourseIds))

      } catch (err) {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Failed to load courses')
        setCourses([])
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    const timeout = setTimeout(() => {
      loadData()
    }, 350) // Matching SEARCH_DEBOUNCE_MS from DashboardPage

    return () => {
      isActive = false
      clearTimeout(timeout)
    }
  }, [searchQuery, reloadToken, role, userId])

  const refetch = () => setReloadToken((prev) => prev + 1)

  return { courses, sectionCounts, isLoading, error, refetch }
}
