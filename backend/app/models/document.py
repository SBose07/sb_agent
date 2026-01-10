from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import uuid4


class DocumentLine(BaseModel):
    """Represents a single line in a document."""
    line_number: int
    content: str


class Document(BaseModel):
    """Document model with content and metadata."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    content: str  # Full document content
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    @property
    def lines(self) -> List[DocumentLine]:
        """Parse content into lines with line numbers."""
        return [
            DocumentLine(line_number=i + 1, content=line)
            for i, line in enumerate(self.content.split('\n'))
        ]
    
    def get_line(self, line_number: int) -> Optional[str]:
        """Get content of a specific line."""
        lines = self.content.split('\n')
        if 1 <= line_number <= len(lines):
            return lines[line_number - 1]
        return None
    
    def update_content(self, new_content: str) -> None:
        """Update document content and timestamp."""
        self.content = new_content
        self.updated_at = datetime.now()


class DocumentCreate(BaseModel):
    """Schema for creating a new document."""
    title: str
    content: str = ""


class DocumentUpdate(BaseModel):
    """Schema for updating a document."""
    title: Optional[str] = None
    content: Optional[str] = None


class DocumentEdit(BaseModel):
    """Represents an edit operation on a document."""
    operation: str  # "insert", "replace", "delete"
    line_start: int
    line_end: Optional[int] = None
    new_content: str = ""
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "operation": "insert",
                    "line_start": 5,
                    "new_content": "This is a new paragraph about AI."
                },
                {
                    "operation": "replace",
                    "line_start": 10,
                    "line_end": 12,
                    "new_content": "Replaced content here."
                }
            ]
        }


class ChatRequest(BaseModel):
    """Schema for chat/edit requests."""
    prompt: str
    document_id: str


class StreamEvent(BaseModel):
    """Schema for streaming events."""
    type: str  # "token", "thinking", "edit", "highlight", "done", "error"
    content: Optional[str] = None
    operation: Optional[DocumentEdit] = None
    line: Optional[int] = None
    summary: Optional[str] = None
    message: Optional[str] = None
