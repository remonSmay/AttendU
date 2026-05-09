from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from Models import Course, Section, User
from controllers.base_controller import CRUDBaseController
from Models.schemas.section import SectionCreate, SectionUpdate


class SectionController(CRUDBaseController[Section]):
    def __init__(self) -> None:
        super().__init__(Section)

    async def _validate_refs(
        self,
        db: AsyncSession,
        *,
        course_id,
        instructor_id,
    ) -> None:
        course_exists = await db.scalar(select(Course.id).where(Course.id == course_id))
        if not course_exists:
            raise ValueError("course_id does not exist")

        instructor_exists = await db.scalar(
            select(User.id).where(User.id == instructor_id)
        )
        if not instructor_exists:
            raise ValueError("instructor_id does not exist")

    async def create_section(self, db: AsyncSession, payload: SectionCreate) -> Section:
        await self._validate_refs(
            db, course_id=payload.course_id, instructor_id=payload.instructor_id
        )
        return await self.create(db, payload.model_dump())

    async def update_section(
        self, db: AsyncSession, section: Section, payload: SectionUpdate
    ) -> Section:
        update_data = payload.model_dump(exclude_unset=True)

        next_course_id = update_data.get("course_id", section.course_id)
        next_instructor_id = update_data.get("instructor_id", section.instructor_id)
        await self._validate_refs(
            db, course_id=next_course_id, instructor_id=next_instructor_id
        )

        return await self.update(db, section, update_data)


section_controller = SectionController()
