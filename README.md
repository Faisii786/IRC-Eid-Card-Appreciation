# IRC Eid Card Appreciation App

Create personalized Eid Al-Fitr appreciation cards with Arabic name rendering, full-screen preview, and one-click downloads.

## Features

- Arabic/English UI toggle with remembered language preference
- Name translation/transliteration to Arabic
- Personalized card image rendering on the server
- Download as image (gallery-friendly JPG) or PDF
- Share card using Web Share API (with copy-link fallback)
- Input validation, honeypot bot check, and API rate limiting
- Save generator responses (name + email) to Google Sheets
- Password-protected admin panel to view responses

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4
- `canvas` for server-side image rendering
- `google-translate-api-x` for Arabic translation fallback
- `googleapis` for Google Sheets integration
- `jspdf` for PDF export

## Environment Variables

Create a `.env.local` file in project root:

```bash
ADMIN_PANEL_PASSWORD=your-strong-password
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SHEETS_SHEET_NAME=Responses
GOOGLE_SHEETS_CLIENT_EMAIL=service-account-email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

Google Sheets setup:

1. Create a Google Cloud service account and enable Google Sheets API.
2. Share your target Google Sheet with `GOOGLE_SHEETS_CLIENT_EMAIL` as Editor.
3. Optional: add a header row in the sheet:
   `timestamp | name | email | arabicName | language | requestId`

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000`.
4. Open `http://localhost:3000/admin` for admin login.

## Project Structure

- `app/page.tsx` - Main UI, form handling, preview/download/share actions
- `app/api/generate-card/route.ts` - Validation, anti-abuse checks, translation, and card generation
- `app/layout.tsx` - Global metadata and social cards
- `app/admin/page.tsx` - Password-protected admin dashboard
- `public/` - Fonts and static assets (favicon/OG image)
- `lib/googleSheets.ts` - Google Sheets read/write helpers

## Notes

- If `public/eid.jpeg` is missing, the API renders a built-in fallback template.
- Arabic font quality depends on available font files in `public/`.
