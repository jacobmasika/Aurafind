# AuraFind

AuraFind is a serverless-ready global missing persons and reunion web app built with Next.js App Router. It includes high-empathy intake workflows, anonymous sightings, found-person registration, probabilistic AI-style matching, emergency broadcast tooling, and a premium mobile-first UI.

## Highlights Implemented

- Frictionless multi-step incident reporting wizard with local draft autosave
- Anonymous sighting submission with geolocation and photo support
- One-click emergency broadcast endpoint and printable missing-person PDF poster generation
- EXIF metadata extraction from uploaded images (client-side)
- Voice-to-text report capture (browser speech recognition)
- Found register for shelters/hospitals/good samaritans
- Discover network for kinship stories with NLP-style tag extraction and overlap linking
- AI-style probabilistic match scoring combining face seed similarity, geo distance, and time windows
- Geofenced push-notification opt-in groundwork with service worker registration
- Dark mode and low-bandwidth mode

## Tech Stack

- Frontend and API: Next.js 16 App Router
- Styling: Tailwind CSS v4 + custom design system
- Motion: Framer Motion
- Validation: Zod
- PDF: jsPDF
- EXIF extraction: exifr

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env.local` and configure as needed.

Communication and AWS variables are optional in this version and used to signal integration readiness.

## API Routes

- `GET/POST /api/reports`
- `GET/POST /api/sightings`
- `GET/POST /api/found`
- `GET/POST /api/discover`
- `POST /api/matches`
- `POST /api/broadcast`
- `GET /api/health`

## Important Note on Persistence

This implementation currently uses in-memory storage for fast setup and demo usability. For production serverless deployment, replace storage with DynamoDB/S3 and wire biometric matching to AWS Rekognition.

## Deploy

Deploy on Vercel for edge hosting:

```bash
npm run build
```

Then import this folder into Vercel and configure environment variables.
