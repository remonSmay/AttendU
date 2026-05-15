"""
Factory Boy factories for generating test data.

These factories provide convenient ways to create model instances with
realistic test data. They integrate with Faker for generating various
data types and support lazy attributes and relationships.

Usage:
    user = UserFactory()
    student = StudentFactory(full_name="John Doe")
    section = SectionFactory(course=course, instructor=instructor)
"""

from datetime import datetime, timedelta
from uuid import uuid4

import factory
from faker import Faker

# Import models after path is set in conftest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from Models.UserModel import User
from Models.StudentsModel import Student
from Models.CourseModel import Course
from Models.SectionsModel import Section
from Models.enrollmentsModel import Enrollment
from Models.AttendanceSessionModel import AttendanceSession
from Models.Device_attendance_events import Device, AttendanceEvent

# Initialize Faker with seed for reproducibility in tests
fake = Faker()


# ============================================================================
# User Factory
# ============================================================================

class UserFactory(factory.Factory):
    """
    Factory for creating User instances with realistic test data.
    
    Default role is 'instructor'. Override role='admin' for admin users.
    """
    class Meta:
        model = User

    id = factory.LazyFunction(uuid4)
    full_name = factory.Faker("name")
    email = factory.Faker("email")
    password_hash = factory.Faker("password", length=20)
    role = factory.Faker("random_element", elements=["instructor", "admin"])
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to handle SQLAlchemy."""
        obj = model_class(*args, **kwargs)
        return obj


class InstructorFactory(UserFactory):
    """Factory for creating instructor users."""
    role = "instructor"


class AdminFactory(UserFactory):
    """Factory for creating admin users."""
    role = "admin"


# ============================================================================
# Course Factory
# ============================================================================

class CourseFactory(factory.Factory):
    """
    Factory for creating Course instances.
    
    Generates realistic course names and unique course codes.
    """
    class Meta:
        model = Course

    id = factory.LazyFunction(uuid4)
    course_name = factory.Faker("words", nb=3, ext_word_list=None)
    course_code = factory.LazyFunction(
        lambda: f"CS{fake.random_int(min=100, max=999)}"
    )
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to handle SQLAlchemy."""
        obj = model_class(*args, **kwargs)
        return obj


# ============================================================================
# Section Factory
# ============================================================================

class SectionFactory(factory.Factory):
    """
    Factory for creating Section instances.
    
    Automatically creates a related Course and Instructor (User) if not provided.
    """
    class Meta:
        model = Section

    id = factory.LazyFunction(uuid4)
    course = factory.SubFactory(CourseFactory)
    instructor = factory.SubFactory(InstructorFactory)
    section_name = factory.LazyFunction(
        lambda: f"Section {fake.random_element(['A', 'B', 'C', 'D', 'E'])}"
    )
    schedule_time = factory.LazyFunction(
        lambda: f"{fake.random_int(min=8, max=17)}:00"
    )
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to handle SQLAlchemy."""
        obj = model_class(*args, **kwargs)
        return obj


# ============================================================================
# Student Factory
# ============================================================================

class StudentFactory(factory.Factory):
    """
    Factory for creating Student instances.
    
    Generates realistic student data including email, phone, RFID UID.
    Face reference image is optional (None by default).
    """
    class Meta:
        model = Student

    id = factory.LazyFunction(uuid4)
    full_name = factory.Faker("name")
    email = factory.Faker("email")
    phone = factory.Faker("phone_number")
    rfid_uid = factory.LazyFunction(
        lambda: f"RFID_{fake.random_int(min=100000, max=999999)}"
    )
    face_reference_image = None
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to handle SQLAlchemy."""
        obj = model_class(*args, **kwargs)
        return obj


# ============================================================================
# Enrollment Factory
# ============================================================================

class EnrollmentFactory(factory.Factory):
    """
    Factory for creating Enrollment (student-section association) instances.
    
    Automatically creates related Student and Section if not provided.
    Ensures unique student-section combinations.
    
    Note: Enrollment doesn't have created_at/updated_at fields.
    """
    class Meta:
        model = Enrollment

    student = factory.SubFactory(StudentFactory)
    section = factory.SubFactory(SectionFactory)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to handle SQLAlchemy."""
        obj = model_class(*args, **kwargs)
        return obj


# ============================================================================
# Device Factory
# ============================================================================

class DeviceFactory(factory.Factory):
    """
    Factory for creating Device instances.
    
    Devices can be optionally assigned to a Section via section_id.
    Generates realistic device names and locations.
    """
    class Meta:
        model = Device

    id = factory.LazyFunction(uuid4)
    device_name = factory.LazyFunction(
        lambda: f"Device_{fake.random_int(min=1000, max=9999)}"
    )
    location = factory.Faker("city")
    section_id = None  # Optional section association
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to handle SQLAlchemy."""
        obj = model_class(*args, **kwargs)
        return obj


class DeviceWithSectionFactory(DeviceFactory):
    """Factory for creating Device instances with assigned Section."""
    section_id = factory.LazyAttribute(lambda obj: uuid4())


# ============================================================================
# Attendance Session Factory
# ============================================================================

class AttendanceSessionFactory(factory.Factory):
    """
    Factory for creating AttendanceSession instances.
    
    Automatically creates related Section and User (created_by).
    Generates start and end times with realistic durations.
    Default verification method is RFID.
    """
    class Meta:
        model = AttendanceSession

    id = factory.LazyFunction(uuid4)
    section = factory.SubFactory(SectionFactory)
    created_by = factory.SubFactory(InstructorFactory)
    title = factory.LazyFunction(
        lambda: f"Session {fake.date_time_this_year()}"
    )
    start_time = factory.LazyFunction(
        lambda: datetime.utcnow().replace(second=0, microsecond=0)
    )
    end_time = factory.LazyFunction(
        lambda: (datetime.utcnow() + timedelta(hours=1.5)).replace(second=0, microsecond=0)
    )
    is_active = True
    verification_method = "RFID"
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to handle SQLAlchemy."""
        obj = model_class(*args, **kwargs)
        return obj


class FaceVerificationSessionFactory(AttendanceSessionFactory):
    """Factory for creating attendance sessions with face verification."""
    verification_method = "FACE"


class RFIDFaceSessionFactory(AttendanceSessionFactory):
    """Factory for creating attendance sessions with RFID+Face verification."""
    verification_method = "RFID_FACE"


class ManualSessionFactory(AttendanceSessionFactory):
    """Factory for creating attendance sessions with manual verification."""
    verification_method = "MANUAL"


# ============================================================================
# Attendance Event Factory
# ============================================================================

class AttendanceEventFactory(factory.Factory):
    """
    Factory for creating AttendanceEvent instances.
    
    Automatically creates all required relationships:
    - Student
    - AttendanceSession (which includes Section)
    - Device
    
    Default status is 'Present' with RFID method.
    """
    class Meta:
        model = AttendanceEvent

    id = factory.LazyFunction(uuid4)
    student = factory.SubFactory(StudentFactory)
    attendance_session = factory.SubFactory(AttendanceSessionFactory)
    section = factory.LazyAttribute(lambda obj: obj.attendance_session.section)
    device = factory.SubFactory(DeviceFactory)
    method_used = "RFID"
    final_status = "Present"
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to handle SQLAlchemy."""
        obj = model_class(*args, **kwargs)
        return obj


class PresentAttendanceFactory(AttendanceEventFactory):
    """Factory for creating 'Present' attendance events."""
    final_status = "Present"


class AbsentAttendanceFactory(AttendanceEventFactory):
    """Factory for creating 'Absent' attendance events."""
    final_status = "Absent"


class LateAttendanceFactory(AttendanceEventFactory):
    """Factory for creating 'Late' attendance events."""
    final_status = "Late"


class FaceAttendanceFactory(AttendanceEventFactory):
    """Factory for creating attendance events with face recognition method."""
    method_used = "FACE"


class ManualAttendanceFactory(AttendanceEventFactory):
    """Factory for creating manually recorded attendance events."""
    method_used = "MANUAL"


# ============================================================================
# Batch Creation Helpers
# ============================================================================

def create_test_section_with_students(
    course: Course = None,
    instructor: User = None,
    num_students: int = 5,
) -> tuple[Section, list[Student], list[Enrollment]]:
    """
    Helper to create a complete section setup with enrolled students.
    
    Args:
        course: Optional Course instance. Creates new if not provided.
        instructor: Optional User instance (instructor). Creates new if not provided.
        num_students: Number of students to enroll in the section.
    
    Returns:
        Tuple of (section, students_list, enrollments_list)
    """
    if course is None:
        course = CourseFactory()
    if instructor is None:
        instructor = InstructorFactory()

    section = SectionFactory(course=course, instructor=instructor)
    students = [StudentFactory() for _ in range(num_students)]
    enrollments = [
        EnrollmentFactory(student=student, section=section)
        for student in students
    ]

    return section, students, enrollments


def create_test_attendance_session_with_events(
    section: Section = None,
    instructor: User = None,
    num_events: int = 5,
    statuses: list[str] = None,
) -> tuple[AttendanceSession, list[AttendanceEvent]]:
    """
    Helper to create an attendance session with multiple attendance events.
    
    Args:
        section: Optional Section instance. Creates new if not provided.
        instructor: Optional User instance (instructor). Creates new if not provided.
        num_events: Number of attendance events to create.
        statuses: Optional list of statuses. If None, randomly distributed.
    
    Returns:
        Tuple of (attendance_session, events_list)
    """
    if section is None:
        _, students, _ = create_test_section_with_students(num_students=num_events)
        section = students[0].enrollments[0].section
    if instructor is None:
        instructor = InstructorFactory()

    session = AttendanceSessionFactory(section=section, created_by=instructor)

    if statuses is None:
        statuses = [fake.random_element(["Present", "Absent", "Late"]) for _ in range(num_events)]

    events = [
        AttendanceEventFactory(
            attendance_session=session,
            section=section,
            final_status=status,
        )
        for status in statuses
    ]

    return session, events
