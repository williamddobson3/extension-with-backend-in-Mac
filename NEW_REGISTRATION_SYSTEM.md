# New Registration System

## Overview
The registration system has been updated to include 5 input fields as requested:
1. **ID** (User ID - replaces username)
2. **Email** 
3. **LINE** (LINE User ID - optional)
4. **Password**
5. **Confirm Password**

## Changes Made

### 1. Frontend Updates

#### HTML (popup.html)
- Updated registration form to include 5 fields
- Added proper labels and placeholders in Japanese
- Made LINE ID field optional
- Added password confirmation field

#### JavaScript (popup.js)
- Enhanced form validation:
  - Checks all required fields are filled
  - Validates password confirmation matches
  - Validates User ID format (alphanumeric and underscores only)
  - Maintains minimum 6-character password requirement
- Updated API call to send LINE ID to backend
- Improved error messages in Japanese

### 2. Backend Updates

#### Authentication Route (routes/auth.js)
- Added support for `line_user_id` parameter
- Enhanced validation:
  - User ID format validation (alphanumeric and underscores)
  - Email format validation
  - Proper error messages
- Database insertion now includes LINE ID
- Notification preferences automatically enable LINE if LINE ID provided
- Returns LINE ID in user object

### 3. Database Schema
- **No changes needed** - existing schema already supports:
  - `username` field (used for User ID)
  - `email` field
  - `line_user_id` field
  - `password_hash` field

## Field Mapping

| Frontend Field | Backend Field | Database Column | Required |
|---------------|---------------|-----------------|----------|
| User ID       | username      | username        | Yes      |
| Email         | email         | email           | Yes      |
| LINE ID       | line_user_id  | line_user_id    | No       |
| Password      | password      | password_hash   | Yes      |
| Confirm Password | (validation only) | (not stored) | Yes      |

## Validation Rules

### User ID
- Required field
- Must contain only letters, numbers, and underscores
- Unique across all users

### Email
- Required field
- Must be valid email format
- Unique across all users

### LINE ID
- Optional field
- If provided, automatically enables LINE notifications
- Stored in both `users` table and `user_notifications` table

### Password
- Required field
- Minimum 6 characters
- Must match confirmation password

## Testing

Use the provided test script to verify the registration system:

```bash
node test-new-registration.js
```

The test script validates:
- ✅ Valid registration with all fields
- ✅ Valid registration without LINE ID
- ✅ Invalid User ID rejection
- ✅ Invalid email rejection
- ✅ Short password rejection

## Usage

Users can now register through the Chrome extension with:
1. A custom User ID (instead of username)
2. Their email address
3. Optional LINE ID for notifications
4. Password with confirmation

The system maintains backward compatibility while providing the enhanced registration experience requested.
