# Caglla Web Album

This is a simple Node.js web application that provides a personal web album for each user.
Authentication is handled via Google OAuth 2.0 and users can perform CRUD operations on
albums and album pages.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set the Google OAuth credentials as environment variables:

```bash
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
```

You can obtain these credentials from the [Google Developer Console](https://console.developers.google.com/).
Set the OAuth callback URL to `http://localhost:3000/auth/google/callback`.

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

Then open `http://localhost:3000` in your browser.

## Features

- Login with Google OAuth 2.0
- Create, read, update and delete albums
- Create, read, update and delete pages within an album

Data is stored in memory for simplicity, so it will be reset when the server restarts.
