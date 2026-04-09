# Auth Rules — Oliveira ERP

## Goal
Provide a realistic, testable authentication flow.

---

## References
- Follow design system defined in project docs
- Follow QA rules defined in project docs

---

## Login Flow

### Fields
- email
- password

### Rules
- All fields are required
- Email must have valid format

---

### Behavior

#### Empty submit
- Show toast (top-right)
- Message: "Please fill in email and password"

#### Partial input
- Email missing → "Valid email is required"
- Password missing → "Password is required"

#### Invalid credentials
- Show toast:
  - "Invalid email or password"

#### Success
- Redirect to: `/home` (placeholder page if not exists)

---

## Register Flow

### Fields
- fullName
- email
- password
- birthDate

### Rules
- All fields required
- Email must be valid
- Email must be unique (backend)

---

### Behavior

#### Empty submit
- Show toast:
  - "Please fill in all required fields"

#### Field validation
- fullName → "Full name is required"
- email → "Invalid email"
- password → "Password is required"
- birthDate → "Birth date is required"

#### Success
- Redirect to: `/login`

---

## UI / UX

- Use toast for global errors
- Use inline validation for field errors
- Do not use browser alerts

---

## QA Requirements

- Forms must not submit if invalid
- Errors must be consistent
- Add `data-testid` to key elements:
  - inputs
  - buttons
  - error messages