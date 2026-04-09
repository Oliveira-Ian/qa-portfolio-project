# HTTP Response Standardization

## Overview
This document defines the standardized HTTP response format for the QA Portfolio Project API. All endpoints must follow these patterns for consistency, maintainability, and ease of integration with frontend applications and testing tools like Postman and Cypress.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
    "message": "Operation completed successfully",
    // or user object, list, etc.
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Clear, user-friendly error message"
}
```

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET operations, successful login |
| 201 | Created | Successful resource creation (user registration) |
| 400 | Bad Request | Validation errors (missing fields, invalid email, duplicate email) |
| 401 | Unauthorized | Authentication failures (invalid credentials) |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Unexpected server errors |

## Implementation Guidelines

### Service Layer
Services return standardized objects:
- Success: `{ success: true, data: result }`
- Error: `{ success: false, error: "message" }`

### Controller Layer
Controllers:
1. Perform input validation (return 400 for invalid input)
2. Call service methods
3. Return appropriate HTTP status based on service result
4. Format JSON response using service result

## API Endpoints

### POST /api/auth/register
**Request Body:**
```json
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "birthDate": "YYYY-MM-DD"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "User created successfully"
  }
}
```

**Error Responses:**
- **400** (Missing fields):
```json
{
  "success": false,
  "error": "Please fill in all required fields"
}
```
- **400** (Invalid email):
```json
{
  "success": false,
  "error": "Invalid email"
}
```
- **400** (Email exists):
```json
{
  "success": false,
  "error": "Email already exists"
}
```
- **500** (Server error):
```json
{
  "success": false,
  "error": "Server error"
}
```

### POST /api/auth/login
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Login successful"
  }
}
```

**Error Responses:**
- **400** (Missing fields):
```json
{
  "success": false,
  "error": "Please fill in email and password"
}
```
- **400** (Invalid email format):
```json
{
  "success": false,
  "error": "Invalid email format"
}
```
- **401** (Invalid credentials):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```
- **500** (Server error):
```json
{
  "success": false,
  "error": "Server error"
}
```

## Notes
- All error messages should be clear and actionable for users
- Frontend applications can rely on `success` boolean to handle responses
- Status codes provide additional context for programmatic handling
- This standardization ensures consistent behavior across all API endpoints