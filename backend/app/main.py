from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api.documents import router as documents_router
from .api.chat import router as chat_router


# Create FastAPI application
app = FastAPI(
    title="GenAI Document Editor",
    description="AI-powered document editing with real-time streaming updates",
    version="1.0.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents_router, prefix="/api/documents")
app.include_router(chat_router, prefix="/api/chat")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "GenAI Document Editor API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "documents": "/api/documents",
            "chat": "/api/chat"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
