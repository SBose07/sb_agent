# GenAI Document Editor

An AI-powered document editing application with real-time streaming updates. Users can prompt the AI to modify documents, and see changes reflected live in the editor.

## Features

- **Real-time Document Editing**: AI makes changes to your documents based on natural language prompts
- **Streaming Responses**: See AI responses stream in real-time
- **Live Document Updates**: Document content updates instantly as the AI generates edits
- **Split-View Interface**: Document editor on the left, chat interface on the right
- **Line Highlighting**: Visual indication of which lines are being edited

## Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **LangGraph** - Agent orchestration for LLM workflows
- **LangChain + Google Gemini** - LLM integration
- **Server-Sent Events (SSE)** - Real-time streaming

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast development server and build tool
- **Custom Hooks** - For document and chat state management

## Project Structure

```
sb_agent/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Configuration settings
│   │   ├── models/
│   │   │   └── document.py      # Pydantic models
│   │   ├── services/
│   │   │   ├── document_service.py  # Document CRUD
│   │   │   └── llm_service.py       # LangGraph agent
│   │   └── api/
│   │       ├── documents.py     # Document endpoints
│   │       └── chat.py          # Streaming chat endpoint
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── App.tsx              # Main application
    │   ├── components/
    │   │   ├── DocumentEditor/  # Document display component
    │   │   └── ChatInterface/   # Chat UI component
    │   ├── hooks/
    │   │   ├── useDocument.ts   # Document state management
    │   │   └── useChat.ts       # Chat + streaming management
    │   ├── services/
    │   │   ├── api.ts           # REST API calls
    │   │   └── streaming.ts     # SSE streaming
    │   └── types/
    │       └── index.ts         # TypeScript types
    ├── package.json
    └── vite.config.ts
```

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google API Key (for Gemini)

### Backend Setup

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On Linux/Mac
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment:
   ```bash
   copy .env.example .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

4. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## Usage

1. Open the application in your browser
2. A sample document will be loaded automatically
3. In the chat panel, type a prompt like:
   - "Add a title at line 1 saying 'Hello World'"
   - "Insert a paragraph about AI after line 5"
   - "Replace line 10 with a better introduction"
   - "Delete line 3"
4. Watch as the AI streams its response and the document updates in real-time!

## API Endpoints

### Documents
- `GET /api/documents/` - List all documents
- `GET /api/documents/{id}` - Get a specific document
- `POST /api/documents/` - Create a new document
- `PUT /api/documents/{id}` - Update a document
- `DELETE /api/documents/{id}` - Delete a document

### Chat
- `POST /api/chat/stream/{document_id}` - Stream AI response with document edits

## Streaming Events

The chat endpoint streams Server-Sent Events with the following types:

| Event Type | Description |
|------------|-------------|
| `thinking` | AI is processing the request |
| `token` | Streaming text content |
| `highlight` | Line number being edited |
| `edit` | Document edit operation |
| `done` | Completion with summary |
| `error` | Error message |

## License

MIT
