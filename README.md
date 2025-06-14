# Caglla Travel Manager

This is a simple Node.js web application that provides personal travel management for each user.
Authentication is handled via Google OAuth 2.0 and users can perform CRUD operations on
travels and their itineraries.

## Setup

1. Install dependencies:

```bash
npm install
```

This will also install the `mysql2` package used for connecting to MySQL.

2. Set the Google OAuth credentials as environment variables:

```bash
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
export DB_HOST=localhost
export DB_USER=db-user
export DB_PASSWORD=db-password
export DB_NAME=caglla
```

You can obtain these credentials from the [Google Developer Console](https://console.developers.google.com/).
Set the OAuth callback URL to `http://localhost:3000/auth/google/callback`.

Ensure you have a running MySQL server and create a database and user with
permissions. Set the `DB_*` variables above to point to this server.

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

5. For testing builds that also compile SCSS, use the batch files under
   `scripts`:

   - **Unix-like systems**
     ```bash
     ./scripts/test_unix.sh
     ```
   - **Windows**
     ```bat
     scripts\test_windows.bat
     ```

   These scripts run TypeScript compilation, compile SCSS files in the
   `scss` directory (if present) and then execute `npm run build && npm start`.

Then open `http://localhost:3000` in your browser.

## Features

- Login with Google OAuth 2.0
- Create, read, update and delete travels
- Create, read, update and delete itineraries within a travel

Travel and itinerary data are stored in a MySQL database configured via the
`DB_*` environment variables.
