---
name: modern-frontend-ui-builder
description: 'Build modern frontend UI screens from a request using React, TypeScript, and Vite. Use for screen/page implementation, responsive layout, component architecture, API integration, loading-error-empty states, accessibility checks, and production-minded polish.'
argument-hint: 'Describe the screen request, target users, data needed, and whether backend API is ready.'
user-invocable: true
---

# Modern Frontend UI Builder

## What This Skill Produces
This skill turns a screen request into a complete implementation plan and code changes for a modern, production-minded frontend page.

Output includes:
- Clear screen requirements and UX decisions
- Component structure and state model
- Page implementation with responsive behavior
- API integration and robust UI states
- Validation checks (run, build, and quality)
- Follow-up improvements and next steps

## When To Use
Use this skill when the user asks to:
- Build a new page or screen from a description
- Upgrade an existing page to look more modern
- Connect a UI page to backend APIs
- Add clean loading, error, success, and empty states
- Get senior-level frontend guidance with beginner-friendly steps

## Inputs To Gather First
Collect these before implementation:
1. Page goal and user role (admin, instructor, student)
2. Required data and actions on the screen
3. API readiness (endpoint exists, mock needed, or unknown)
4. Visual direction constraints (existing design system or fresh style)
5. Device priorities (mobile-first, desktop-first, or both equally)

If data is missing, ask concise clarifying questions and continue.

## Workflow
1. Define scope in one short paragraph.
2. Split the page into sections (header, filters, content, actions, feedback).
3. Create a component map:
   - Page container
  - Reusable UI pieces
   - Data layer utilities (API client/hooks)
4. Define UI states explicitly:
   - idle
   - loading
   - success
   - empty
   - error
5. Implement structure first, then styling, then API wiring.
6. Add defensive handling:
   - input validation
   - network failure handling
   - fallback messages
7. Verify responsiveness on mobile and desktop breakpoints.
8. Run and validate:
   - frontend dev server
   - frontend build/lint where available
   - backend connectivity check for integrated pages
9. Summarize exactly what changed and what remains.

## Decision Points And Branching
- If backend API is ready:
  - integrate real fetch/HTTP logic
  - map server errors to user-facing messages
- If backend API is not ready:
  - create typed mock service with the same response shape
  - keep integration boundary clean for easy swap later
- If page already exists:
  - refactor incrementally without breaking behavior
- If no design system exists:
  - define page-level design tokens first (colors, spacing, type scale)
- If user is beginner:
  - explain each major change in simple, practical language

## Quality Criteria (Done Definition)
A page is considered done when all are true:
1. The requested screen exists and is navigable.
2. Layout works on small and large screens.
3. All core states are represented (loading/error/empty/success).
4. API calls are isolated and typed.
5. No obvious runtime errors in the browser.
6. Build succeeds (or blockers are documented clearly).
7. Changes are explained with concrete file-level summary.

## UI Standards
- Prefer consistent spacing and typography scale.
- Use semantic HTML and accessible labels.
- Keep components focused and reusable.
- Avoid hardcoding API URLs; use environment variables.
- Keep animations subtle and meaningful.
- Avoid visual noise; prioritize clarity and hierarchy.

## Output Format For Responses
Always respond in this order:
1. Result status (working now or blocked)
2. Files changed
3. What was implemented and why
4. How it was validated
5. Next 1-3 steps

## Example Prompts
- Build a modern students page with search, filters, and attendance cards.
- Create an attendance session screen with live check-in states and error handling.
- Upgrade the login screen to a polished responsive design and connect real auth API.
- Implement a reports page with summary cards, table, and export actions.
