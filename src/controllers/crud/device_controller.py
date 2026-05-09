from sqlalchemy.ext.asyncio import AsyncSession

from Models import Device
from controllers.base_controller import CRUDBaseController
from Models.schemas.device import DeviceCreate, DeviceUpdate


class DeviceController(CRUDBaseController[Device]):
    def __init__(self) -> None:
        super().__init__(Device)

    async def create_device(self, db: AsyncSession, payload: DeviceCreate) -> Device:
        return await self.create(db, payload.model_dump())

    async def update_device(
        self, db: AsyncSession, device: Device, payload: DeviceUpdate
    ) -> Device:
        return await self.update(db, device, payload.model_dump(exclude_unset=True))


device_controller = DeviceController()
