# 🔐 Credentials Setup Guide

To enable Google Login and the new Database, you need to get credentials from Google and Vercel/Supabase.

## 1. Google OAuth Credentials (for Login)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown (top left) and select **New Project**. Name it "NeuroQuest" (or anything you like).
3.  In the sidebar, go to **APIs & Services** > **Credentials**.
4.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
5.  If asked to configure the consent screen:
    *   User Type: **External**.
    *   App Name: "NeuroQuest".
    *   User Support Email: Select your email.
    *   Developer Contact Info: Enter your email.
    *   Click **Save and Continue** (you can skip scopes/test users for now).
    *   Go back to **Credentials** > **+ CREATE CREDENTIALS** > **OAuth client ID**.
6.  Application type: **Web application**.
7.  Name: "NeuroQuest Web".
8.  **Authorized JavaScript origins**:
    *   `http://localhost:3000`
    *   (Add your Vercel URL here later, e.g. `https://your-app.vercel.app`)
9.  **Authorized redirect URIs**:
    *   `http://localhost:3000/api/auth/callback/google`
    *   (Add your Vercel URL later: `https://your-app.vercel.app/api/auth/callback/google`)
10. Click **Create**.
11. Copy the **Client ID** and **Client Secret**.

## 2. Database Credentials (Vercel Postgres)

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Select your project (or create a new one and import this repo).
3.  Go to the **Storage** tab.
4.  Click **Create Database** > **Postgres**.
5.  Accept the terms and create.
6.  Once created, go to the **.env.local** tab in the database view.
7.  Copy the `POSTGRES_URL` (it looks like `postgres://default:password@...`).

## 3. Update Your Environment

Create or update the `.env` file in your project root with these values:

```env
# Database Connection
POSTGRES_URL="paste_your_postgres_url_here"

# NextAuth Configuration
AUTH_SECRET="run_openssl_command_below_to_get_this"
AUTH_GOOGLE_ID="paste_your_google_client_id_here"
AUTH_GOOGLE_SECRET="paste_your_google_client_secret_here"
```

To generate a secure `AUTH_SECRET`, run this in your terminal:
```bash
openssl rand -base64 32
```
