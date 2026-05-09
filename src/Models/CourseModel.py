
from sqlalchemy import  String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from helpers.database import Base
from Models.base_data_model import BaseDataModel


class Course(Base, BaseDataModel):
    __tablename__ = "courses"

    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    course_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    sections = relationship("Section", back_populates="course", cascade="all, delete-orphan")



