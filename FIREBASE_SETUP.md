# Firebase Setup Guide

## Problem
You're getting "Missing or insufficient permissions" errors because Firebase Firestore security rules are not configured.

## Solution

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase in your project (if not already done)
```bash
firebase init
```
- Select Firestore and Hosting
- Choose your existing project
- Use the default settings

### 4. Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

### 5. Deploy Firestore Indexes (if needed)
```bash
firebase deploy --only firestore:indexes
```

## Security Rules Explanation

The `firestore.rules` file contains rules that:

1. **Users Collection**: Users can only read/write their own user document
2. **Friends Subcollection**: Users can manage their friends list
3. **Expenses Collection**: Any authenticated user can read/write expenses
4. **Groups Collection**: Any authenticated user can read/write groups
5. **Friend Requests**: Any authenticated user can manage friend requests
6. **Group Invitations**: Any authenticated user can manage group invitations

## Alternative: Temporary Open Rules (Development Only)

If you want to test quickly during development, you can temporarily use open rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING**: Never use open rules in production!

## Troubleshooting

1. **Permission Denied**: Make sure you're logged in to Firebase CLI
2. **Project Not Found**: Verify your project ID in `firebase.json`
3. **Rules Not Applied**: Wait a few minutes after deployment for rules to propagate

## Next Steps

After deploying the rules, your app should work without permission errors. The improved error handling will also provide better user feedback if issues occur. 