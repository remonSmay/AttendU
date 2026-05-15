# AttendU Testing Setup Guide

This document describes the testing infrastructure for the AttendU project.

## Files Created

### 1. `requirements-test.txt`
Contains all test dependencies with pinned versions matching production versions where applicable:
- **pytest** (7.4.4) - Core testing framework
- **pytest-asyncio** (0.23.3) - Async test support
- **pytest-mock** (3.14.0) - Mocking utilities
- **pytest-cov** (4.1.0) - Coverage reporting
- **httpx** (0.27.0) - Async HTTP client for API testing
- **factory-boy** (3.3.0) - Test data factories
- **faker** (24.3.0) - Fake data generation

Plus all production dependencies.

**Install**: `pip install -r requirements-test.txt`

### 2. `pytest.ini`
Pytest configuration with:
- **asyncio_mode = auto** - Automatic async fixture handling
- **testpaths = tests** - Tests directory location
- **Custom markers** - unit, integration, asyncio, slow, smoke
- **Strict markers** - Prevents misspelled markers

### 3. `pyproject.toml` (Updated)
Enhanced project configuration with:
- **[project.optional-dependencies]** - test and dev dependencies
- **[tool.pytest.ini_options]** - Pytest configuration
- **[tool.coverage.run]** - Coverage source paths and exclusions
- **[tool.coverage.report]** - Coverage reporting options

### 4. `conftest.py`
Pytest configuration file with key fixtures:

#### Async Event Loop
- `event_loop` - Session-scoped event loop for all tests

#### Database Fixtures
- `test_db_engine` - Fresh in-memory SQLite for each test
- `test_db_session` - Async session for database access
- `clean_database` - Pre/post-test database cleanup

#### FastAPI Fixtures
- `app_with_test_db` - FastAPI app with overridden database dependency
- `async_client` - AsyncClient for API testing

#### Utilities
- `setup_test_environment` - Test environment configuration
- `mock_async_generator` - Helper for testing async generators

#### Environment Setup
- Sets `ENV=test` for test mode
- Sets `DATABASE_URL` to SQLite in-memory database
- Mocks `face_recognition` if not available

### 5. `factories.py`
Factory Boy factories for test data generation:

#### User Factories
- `UserFactory` - Generic user with random role
- `InstructorFactory` - User with instructor role
- `AdminFactory` - User with admin role

#### Course & Section Factories
- `CourseFactory` - Creates courses with unique codes
- `SectionFactory` - Creates sections with course and instructor relationships

#### Student & Enrollment Factories
- `StudentFactory` - Creates students with RFID UIDs
- `EnrollmentFactory` - Creates student-section associations

#### Device Factory
- `DeviceFactory` - Creates devices with optional section assignment

#### Attendance Session Factories
- `AttendanceSessionFactory` - RFID verification (default)
- `FaceVerificationSessionFactory` - Face verification
- `RFIDFaceSessionFactory` - Combined RFID+Face
- `ManualSessionFactory` - Manual verification

#### Attendance Event Factories
- `AttendanceEventFactory` - Generic attendance event
- `PresentAttendanceFactory` - Present status
- `AbsentAttendanceFactory` - Absent status
- `LateAttendanceFactory` - Late status
- `FaceAttendanceFactory` - Face recognition method
- `ManualAttendanceFactory` - Manual method

#### Batch Helpers
- `create_test_section_with_students(num_students=5)` - Complete section with enrolled students
- `create_test_attendance_session_with_events(num_events=5)` - Session with multiple attendance events

## Usage Examples

### Basic Test File Structure
```python
import pytest
from factories import UserFactory, StudentFactory, SectionFactory

@pytest.mark.asyncio
async def test_user_creation(test_db_session):
    """Test user creation in database."""
    user = UserFactory.build()
    # Test logic here
    pass


@pytest.mark.asyncio
async def test_api_endpoint(async_client):
    """Test API endpoint."""
    response = await async_client.get("/api/users")
    assert response.status_code == 200
```

### Using Factories with Database
```python
@pytest.mark.asyncio
async def test_section_with_students(test_db_session):
    """Test section with enrolled students."""
    from factories import create_test_section_with_students
    
    section, students, enrollments = create_test_section_with_students(
        num_students=10
    )
    test_db_session.add(section)
    test_db_session.add_all(students)
    test_db_session.add_all(enrollments)
    await test_db_session.commit()
    
    # Test logic using the created data
    assert len(section.enrollments) == 10
```

### Using Specific Factory Variants
```python
@pytest.mark.asyncio
async def test_attendance_with_face_verification(test_db_session):
    """Test attendance session with face verification."""
    from factories import (
        FaceVerificationSessionFactory,
        FaceAttendanceFactory
    )
    
    session = FaceVerificationSessionFactory.build()
    event = FaceAttendanceFactory.build(attendance_session=session)
    
    assert session.verification_method == "FACE"
    assert event.method_used == "FACE"
```

## Running Tests

### Run all tests
```bash
pytest
```

### Run with verbose output
```bash
pytest -v
```

### Run specific test file
```bash
pytest tests/test_users.py
```

### Run specific test
```bash
pytest tests/test_users.py::test_user_creation
```

### Run with coverage
```bash
pytest --cov=src --cov-report=html --cov-report=term-missing
```

### Run specific marker
```bash
pytest -m unit
pytest -m integration
pytest -m asyncio
```

### Run excluding slow tests
```bash
pytest -m "not slow"
```

## Test Directory Structure

Recommended organization:
```
tests/
├── __init__.py
├── test_users.py           # User model and endpoints
├── test_students.py        # Student model and endpoints
├── test_courses.py         # Course model and endpoints
├── test_sections.py        # Section model and endpoints
├── test_attendance.py      # Attendance logic
├── test_api/
│   ├── test_auth.py
│   ├── test_endpoints.py
│   └── test_errors.py
└── integration/
    ├── test_workflows.py
    └── test_scenarios.py
```

## Key Features

### ✅ Async-First Design
- All fixtures are async-compatible
- In-memory SQLite database with aiosqlite driver
- Proper event loop handling

### ✅ Dependency Injection
- Database dependency is automatically overridden
- Each test gets a fresh database session
- Automatic rollback after each test

### ✅ Realistic Test Data
- Faker integration for natural-looking data
- UUID generation for IDs
- Proper timestamp handling

### ✅ Flexible Factories
- Build (no persistence) vs Create (persisted) strategies
- SubFactories for relationships
- LazyAttributes for computed fields
- Specialized factory variants for different scenarios

### ✅ Coverage Reporting
- Source code coverage tracking
- HTML and terminal reports
- Excludes test code, migrations, virtual environments

## Troubleshooting

### Import Errors
If you get import errors when running tests:
1. Ensure you're in the project root directory
2. Check that `conftest.py` is in the root directory
3. Verify `factories.py` is in the root directory
4. Run `pip install -r requirements-test.txt`

### Async Test Issues
- Ensure all async tests are marked with `@pytest.mark.asyncio`
- Conftest handles event loop automatically (asyncio_mode = auto)
- Don't use `asyncio.run()` in test functions

### Database Issues
- Each test gets a fresh in-memory SQLite database
- No setup/migration needed (uses SQLAlchemy metadata)
- Check that test fixtures are injected correctly

## Next Steps

1. Create test files in `tests/` directory
2. Use factories and fixtures in your tests
3. Run `pytest --cov=src` to check coverage
4. Aim for >80% code coverage
5. Mark slow tests with `@pytest.mark.slow`
6. Use `@pytest.mark.integration` for integration tests

