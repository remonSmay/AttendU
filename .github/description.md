Introduction
1.1 Purpose

This document specifies the requirements for a Smart Attendance Management System used in a university environment. The system integrates:

RFID cards

ESP32-based classroom devices

Face recognition validation

Centralized backend

Role-based access control

1.2 Scope

The system enables:

Automated attendance capture using RFID + face verification

Real-time attendance tracking

Role-based dashboards

Administrative oversight

Audit logging

Device-based secure submission

It replaces manual attendance sheets and reduces fraud.

1.3 Definitions

Attendance Session: A scheduled time window for a lecture.

Check-in Event: A student attendance attempt.

Verification: Face recognition validation result.

RFID Event: Raw hardware scan event.

Device: ESP32 classroom hardware.

1. Overall Description
2.1 Product Perspective

System Architecture:

ESP32 Device Layer

Face Recognition Microservice

Backend API (FastAPI)

PostgreSQL Database

Object Storage (face embeddings)

Admin Web Dashboard

2.2 User Classes

Student

Teaching Assistant

Lecturer

Dean (Super Admin)

Device (Machine Actor)

2.3 Operating Environment

Linux servers (Ubuntu)

PostgreSQL 15+

Python 3.11+

FastAPI
JWT-based authentication

1. Functional Requirements
3.1 Authentication & Authorization

FR-1: Users shall authenticate using email + password.
FR-2: JWT access tokens shall be issued.
FR-3: Role-based access control shall be enforced.

3.2 Attendance Session Management

FR-4: Lecturer shall create attendance sessions.
FR-5: Session must have start_time and end_time.
FR-6: Only one active session per course per classroom.

3.3 Attendance Capture

FR-7: Device shall submit RFID event.
FR-8: System shall validate session state.
FR-9: Face recognition must match student identity.
FR-10: Attendance record shall be persisted only if verification succeeds.

3.4 Reporting

FR-11: Lecturer shall view attendance per course.
FR-12: Dean shall view attendance across all departments.
FR-13: Export to CSV.

3.5 Audit Logging

FR-14: All check-in attempts must be logged.
FR-15: System must store fraud attempts.

4. Non-Functional Requirements
4.1 Performance

Attendance submission latency < 300ms

1000 concurrent device submissions

99.9% uptime

4.2 Security

TLS required

Passwords hashed (bcrypt)

JWT expiration: 15 minutes

Refresh tokens rotation

Device authentication via signed API keys

Anti-replay protection

4.3 Scalability

Horizontally scalable API

Stateless services

Asynchronous face verification

4.4 Reliability

Idempotent attendance submissions

Retry-safe device communication

4.5 Maintainability

Modular architecture

Domain-driven design

Clear separation of bounded contexts
. Project Overview

The Smart Hybrid Attendance Management System (SHAMS) is a distributed backend-driven platform designed to automate, verify, and audit attendance processes within a university environment using a combination of:

RFID-based identification

Face recognition verification

Real-time device communication (ESP32-CAM)

Centralized backend system (FastAPI-based)

Administrative dashboard

Analytics & reporting module

The system is designed as an enterprise-grade backend system that integrates hardware devices, computer vision models, and role-based access control into a unified architecture.

2. Business Context
Target Environment

Universities / Colleges

Engineering Faculties

Large academic institutions

Current Problems in Traditional Attendance

Manual attendance is unreliable.

Proxy attendance (students marking for each other).

No real-time validation.

Poor auditability.

No cross-department monitoring.

No centralized reporting for deans.

Why This System Exists

To provide:

Secure attendance verification.

Anti-spoofing mechanism (RFID + Face).

Real-time synchronization.

Hierarchical visibility control.

Data-driven attendance analytics.

Institutional-level monitoring capability.

3. System Actors
1. Student

Has RFID card.

Face enrolled in system.

Attends lectures.

Cannot manipulate attendance.

2. Teaching Assistant (TA)

Manages sections.

Can view section attendance.

Cannot override system fraudulently.

3. Professor

Manages course lectures.

Can open/close attendance session.

Can view attendance reports.

4. Dean (Super Admin)

Full read access across all courses.

Can audit professors and TAs.

Can monitor anomalies.

5. IoT Devices

RFID Reader

ESP32-CAM

Edge gateway (optional)

6. Face Recognition Microservice

ML model service.

Performs embedding extraction.

Returns similarity score.

4. Core System Goals

Prevent proxy attendance.

Enforce biometric validation.

Provide hierarchical transparency.

Maintain immutable attendance logs.

Support horizontal scaling.

Enable analytics and anomaly detection.

5. System Architecture (High-Level)
Architecture Style

API-first architecture

Modular monolith (initially)

Event-driven integration (future)

Microservice-ready

Main Components

API Gateway (FastAPI)

Authentication Service (JWT/OAuth2)

Attendance Service

User Management Service

Device Communication Layer

Face Recognition Service (separate ML service)

Database (PostgreSQL)

Redis (caching / rate limiting)

Message Queue (optional for async validation)

6. Attendance Flow (Conceptual)

Professor opens session.

Student scans RFID.

System validates:

Is session open?

Is student registered in course?

ESP32-CAM captures image.

Image sent to face recognition service.

Face embedding compared with stored template.

If similarity > threshold:

Attendance recorded.

Immutable log stored.

This is a multi-layer verification pipeline.

7. Core Business Entities

User

Role

Student

Professor

TeachingAssistant

Course

Section

LectureSession

AttendanceRecord

Device

FaceEmbedding

AuditLog

8. Business Rules & Invariants

A student cannot be marked present twice in the same session.

A session must be open before attendance is accepted.

Only the professor of the course can open a session.

TA can view but not override biometric validation.

Dean has read-only global visibility.

Face recognition threshold must be configurable.

Attendance once verified cannot be deleted — only flagged.

These rules form the domain integrity constraints.

9. Security Requirements

JWT authentication.

Role-Based Access Control (RBAC).

Device authentication tokens.

Rate limiting for device endpoints.

Audit logging of critical actions.

Protection against:

Replay attacks

Face spoofing

RFID cloning

10. Performance Constraints

500+ concurrent students scanning within 10 minutes.

Attendance verification latency < 2 seconds.

Face recognition response < 500ms.

High availability during lecture times.

11. Scalability Considerations

Horizontal scaling of API.

Stateless services.

Redis caching for session validation.

Async processing for image verification (optional).

CDN or object storage for images.

12. Data Characteristics

Highly relational data.

Strong consistency required.

Audit-critical records.

Sensitive biometric data.

13. Observability Requirements

Structured logging.

Centralized log aggregation.

Attendance anomaly detection.

Failed authentication tracking.

Device health monitoring.

14. Failure Scenarios

Face mismatch.

Network delay from device.

Duplicate scan.

Session expired.

Student not registered.

Device compromised.

System must fail safely and log everything.

15. Future Extensions

AI-based anomaly detection (cheating patterns).

Mobile app for students.

Push notifications.

Multi-campus federation.

Real-time dashboards.

Analytics heatmaps.

16. Engineering Philosophy

This system is built with the following architectural philosophy:

API is the contract.

Domain defines the system.

Database supports the domain — not vice versa.

Security is default.

Logging is mandatory.

Everything is traceable.

Design for scale from day one.

Separate device logic from business logic.

Treat biometric validation as a service boundary.

17. Technical Stack (Recommended)

Backend:

Python

FastAPI

PostgreSQL

SQLAlchemy

Redis

Alembic

ML:

PyTorch

FaceNet / ArcFace

FAISS (optional for vector similarity)

Infra:

Docker

Nginx

CI/CD

Linux (Ubuntu)

18. System Boundaries

Inside system:

Authentication

Attendance logic

Reporting

Authorization

Session management

Outside system:

University ERP

Payment system

External identity providers

19. Design Priorities (Ordered)

Correctness

Security

Observability

Scalability

Performance

Developer ergonomics