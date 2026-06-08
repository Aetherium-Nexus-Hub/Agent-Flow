<div align="center">
<img width="1200" height="475" alt="AgentFlow Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AgentFlow

Transform any document into a structured, time-stamped meeting agenda and stakeholder map using AI.

## About

AgentFlow is an intelligent document processing application powered by Google's Gemini AI. It automatically extracts meeting information from documents, organizes agendas by time slots, and identifies key stakeholders—streamlining meeting preparation and follow-up.

## Features

- 📄 **Document Processing**: Upload and analyze any document
- 🕐 **Time-Stamped Agendas**: Automatically generate organized meeting agendas with time allocations
- 👥 **Stakeholder Mapping**: Identify and map key stakeholders and their roles
- 🤖 **AI-Powered**: Built on Google's Gemini 2.5 Flash model
- ⚡ **Real-time Processing**: Quick document analysis and agenda generation
- 🎨 **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, TypeScript
- **Backend**: Express.js, TypeScript
- **AI**: Google Gemini API (genai SDK)
- **Database**: Firebase / Firestore
- **UI Components**: Base UI, shadcn, Lucide React Icons
- **Animation**: Motion

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

## Setup & Installation

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`
   - Add your Gemini API key:
     ```bash
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

4. **Run locally**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run preview` - Preview production build locally
- `npm run clean` - Clean build artifacts
- `npm run lint` - Type check with TypeScript

## Project Structure

```
.
├── src/                    # React source files
├── components/             # Reusable React components
├── lib/                    # Utility libraries and helpers
├── server.ts               # Express.js backend server
├── index.html              # Entry HTML file
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── firestore.rules         # Firestore security rules
├── metadata.json           # App metadata
└── package.json            # Project dependencies
```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns: `{ "status": "ok" }`

### Query Endpoint
```
POST /api/v1/query
Content-Type: application/json

{
  "query": "your query text here"
}
```
Returns: AI-generated response using Gemini model

## Deployment

The project is built using Vite and Express.js, making it deployable to various platforms:

- **Cloud Run** (Google Cloud)
- **Vercel**
- **Heroku**
- **Docker** (containerized deployment)

Production builds use esbuild to bundle the Express server with all dependencies.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key for AI queries |
| `APP_URL` | Optional | The hosted app URL (auto-injected in AI Studio) |
| `NODE_ENV` | Optional | Set to `production` for production builds |

## Firestore Configuration

The app uses Firestore for data persistence. Security rules are defined in `firestore.rules` and control read/write access to the database.

## Development Notes

- The app uses Vite for fast development experience with Hot Module Replacement (HMR)
- TypeScript ensures type safety throughout the codebase
- Tailwind CSS with custom animations provides a modern UI
- Firebase integration handles data persistence and authentication

## Contributing

Feel free to fork this repository and submit pull requests for any improvements!

## License

This project is based on the [AI Studio Repository Template](https://github.com/google-gemini/aistudio-repository-template).

## Support

For questions or issues, please open an issue on the [GitHub repository](https://github.com/Aetherium-Nexus-Hub/Agent-Flow).

---

**Created by**: Aetherium-Nexus-Hub Organization
