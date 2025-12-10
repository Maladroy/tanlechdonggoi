# Admin Setup Guide

Since we have secured the application by removing the hardcoded backdoor and implementing Firestore Security Rules, you need to follow these steps to set up the environment and your Admin account.

## 1. Deploy Firestore Security Rules

You need to deploy the rules defined in `firestore.rules` to your Firebase project.

### Prerequisites
- Install Firebase CLI: `npm install -g firebase-tools`
- Login to Firebase: `firebase login`

### Deploy Command
Run the following command in your terminal:

```bash
firebase deploy --only firestore:rules
```

This ensures that:
- Only Admins can manage Combos and Coupons.
- Users can only read/update their own profile data.
- Only Admins can update Order statuses.

## 2. Create an Admin Account

Since there is no "Sign Up as Admin" page (for security reasons), you must manually promote a user to Admin status.

### Step-by-Step Guide

1.  **Register a regular account**:
    -   Open the app at `http://localhost:5173` (or your production URL).
    -   Click "Đăng Ký".
    -   Register with your desired Phone Number (e.g., `0901234567`).

2.  **Go to Firebase Console**:
    -   Open [Firebase Console](https://console.firebase.google.com/).
    -   Select your project (`tanlechdonggoi`).
    -   Go to **Firestore Database** -> **Data**.

3.  **Find your User Document**:
    -   Open the `users` collection.
    -   Look for the document corresponding to your user. The Document ID is usually your Authentication UID (you can check Authentication tab to find your UID).
    -   You can also identify it by the `phone` or `name` field.

4.  **Add `isAdmin` field**:
    -   Click the **Three Dots** icon on your user document -> **Update document** (or just Add Field if viewing the document).
    -   Add a new field:
        -   **Field**: `isAdmin`
        -   **Type**: `boolean`
        -   **Value**: `true`
    -   Click **Update** / **Add**.

5.  **Login as Admin**:
    -   Go back to the app.
    -   Refresh the page or Logout and Login again.
    -   You should now be redirected to the **Admin Dashboard** automatically.
