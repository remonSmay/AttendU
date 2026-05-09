from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from fastapi import HTTPException, status

from Models import User, Section
from controllers.base_controller import CRUDBaseController
from helpers.auth import get_password_hash


class UserController(CRUDBaseController[User]):
    def __init__(self) -> None:
        super().__init__(User)

    async def list_users(
        self, db: AsyncSession, *, offset: int = 0, limit: int = 50
    ) -> list[User]:
        return await self.list_all(db, offset=offset, limit=limit)

    async def create_user(self, db: AsyncSession, payload: dict) -> User:
        if "password" in payload:
            payload["password_hash"] = get_password_hash(payload.pop("password"))
        return await self.create(db, payload)

    async def delete_user(self, db: AsyncSession, user_id: UUID) -> None:
        user = await self.get_by_id(db, user_id)
        if user:
            # Prevent deleting a user who is assigned as instructor to any section
            stmt = select(Section).where(Section.instructor_id == user.id).limit(1)
            res = await db.execute(stmt)
            section_exists = res.scalar_one_or_none()
            if section_exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete user: assigned as instructor to one or more sections. Reassign or remove sections first.",
                )

            await self.delete(db, user)


user_controller = UserController()
