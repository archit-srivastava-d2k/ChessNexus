# ChessGPT

ChessGPT is an AI-powered chatbot web application that answers chess-related questions using Retrieval-Augmented Generation (RAG) and the Gemini API. It leverages Next.js (App Router), React, LangChain, DataStax Astra DB, and modern authentication (Clerk-ready). The app features a beautiful chess-themed UI and provides expert-level chess insights, strategies, and resources.

---

## Features

- **AI Chatbot**: Ask any chess question and get expert, markdown-formatted answers.
- **RAG Pipeline**: Combines Gemini LLM with a vector database for context-aware responses.
- **Modern UI**: Responsive, chess-themed design with animated backgrounds and glowing effects.
- **Markdown Support**: Answers are formatted for readability and clarity.
- **Prompt Suggestions**: Quick-start prompts for new users.

---

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript
- **AI/LLM**: Google Gemini API via `@google/generative-ai`
- **RAG/Vector DB**: LangChain, DataStax Astra DB
- **Authentication**: Clerk (optional, easy to add)
- **Styling**: CSS (custom, responsive, chess-themed)

---

## Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/chessgpt.git
cd chessgpt
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory and add the following (replace with your actual keys):

```
ASTRA_DB_NAMESPACE=your_namespace
ASTRA_DB_COLLECTION=your_collection
ASTRA_DB_API_ENDPOINT=your_astra_db_endpoint
ASTRA_DB_APPLICATION_TOKEN=your_astra_db_token
GOOGLE_API_KEY=your_gemini_api_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key   # (if using Clerk)
CLERK_SECRET_KEY=your_clerk_secret_key                         # (if using Clerk)
```

### 4. Prepare the Database

Seed your Astra DB with chess data:

```sh
npm run seed
```

This will scrape and embed chess resources into your vector database.

### 5. Run the Development Server

```sh
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use ChessGPT.

---

## Project Structure

```
/app
  /api
    /chat/route.ts      # API route for chat (RAG + Gemini)
  /components           # UI components (Bubble, LoadingBubble, etc.)
  /assets               # Static assets (logo, images)
  /page.tsx             # Main chat UI
  /layout.tsx           # App layout and metadata
  /global.css           # Global styles
/scripts
  loadDb.ts             # Script to scrape and embed chess data
.env.local              # Environment variables
```

---

## Customization

- **Logo**: Replace `/public/assets/logochess.png` with your own logo.
- **Styling**: Edit `global.css` for theme changes.
- **Prompt Suggestions**: Update `PromptSuggestionRow` for new starter prompts.

---

## License

MIT

---

## Credits

- [Next.js](https://nextjs.org/)
- [Google Gemini API](https://ai.google.dev/)
- [LangChain](https://js.langchain.com/)
- [DataStax Astra DB](https://www.datastax.com/products/datastax-astra-db)
- [Clerk](https://clerk.com/)
