from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


ModelType = TypeVar("ModelType")


class CRUDBaseController(Generic[ModelType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    async def get_by_id(self, db: AsyncSession, entity_id: UUID) -> ModelType | None:
        result = await db.execute(select(self.model).where(self.model.id == entity_id))
        return result.scalar_one_or_none()

    async def list_all(
        self, db: AsyncSession, *, offset: int = 0, limit: int = 100
    ) -> list[ModelType]:
        result = await db.execute(
            select(self.model).offset(max(offset, 0)).limit(max(min(limit, 200), 1))
        )
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, data: dict[str, Any]) -> ModelType:
        entity = self.model(**data)
        db.add(entity)
        await db.commit()
        await db.refresh(entity)
        return entity

    async def update(
        self, db: AsyncSession, entity: ModelType, data: dict[str, Any]
    ) -> ModelType:
        for key, value in data.items():
            setattr(entity, key, value)
        await db.commit()
        await db.refresh(entity)
        return entity

    async def delete(self, db: AsyncSession, entity: ModelType) -> None:
        await db.delete(entity)
        await db.commit()
