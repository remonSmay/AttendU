from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.crud.course_controller import course_controller
from helpers.database import async_get_db
from helpers.dependencies import (
    get_current_user,
    ensure_admin,
    ensure_admin_or_instructor,
)
from Models import User
from Models.schemas.course import (
    CourseDashboardResponse,
    CourseCreate,
    CourseResponse,
    CourseStudentAttendanceResponse,
    CourseUpdate,
)


router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    try:
        return await course_controller.create_course(db, payload)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="course code already exists",
        ) from exc


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    return await course_controller.list_all(db, offset=offset, limit=limit)


@router.get("/search", response_model=list[CourseResponse])
async def search_courses(
    query: str = Query(min_length=1),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    return await course_controller.search(db, query=query, offset=offset, limit=limit)


@router.get(
    "/{course_id}/students", response_model=list[CourseStudentAttendanceResponse]
)
async def list_course_students(
    course_id: UUID,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    course = await course_controller.get_by_id(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="course not found"
        )

    return await course_controller.list_course_students_with_attendance(
        db,
        course_id,
        current_user,
        offset=offset,
        limit=limit,
    )


@router.get("/{course_id}/dashboard", response_model=CourseDashboardResponse)
async def get_course_dashboard(
    course_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin_or_instructor(current_user)

    course = await course_controller.get_by_id(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="course not found"
        )

    return await course_controller.get_course_dashboard(db, course_id, current_user)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    course = await course_controller.get_by_id(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="course not found"
        )
    return course


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    payload: CourseUpdate,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    course = await course_controller.get_by_id(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="course not found"
        )

    try:
        return await course_controller.update_course(db, course, payload)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="course code already exists",
        ) from exc


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    course = await course_controller.get_by_id(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="course not found"
        )
    await course_controller.delete(db, course)
