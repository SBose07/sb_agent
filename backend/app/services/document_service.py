from typing import Dict, List, Optional
from datetime import datetime
from ..models.document import Document, DocumentCreate, DocumentUpdate


class DocumentService:
    """In-memory document storage and management service."""
    
    def __init__(self):
        self._documents: Dict[str, Document] = {}
        # Create a sample document
        self._create_sample_document()
    
    def _create_sample_document(self):
        """Create a sample document for testing."""
        sample_content = """# Welcome to the GenAI Document Editor

This is a sample document to demonstrate the capabilities of the **AI-powered editor**.

## ✨ Features

- **Real-time editing** with AI assistance
- *Streaming responses* that update the document live
- Natural language commands for document manipulation

## 🚀 Getting Started

1. Type your instructions in the chat panel
2. Watch as the AI modifies your document in real-time
3. You can ask for insertions, modifications, or deletions

> **Pro Tip:** Use the Preview mode to see your formatted document!

## 📝 Markdown Support

This editor supports **full Markdown** formatting:

### Text Formatting
- **Bold text** using `**text**`
- *Italic text* using `*text*`
- `Inline code` using backticks
- ~~Strikethrough~~ using `~~text~~`

### Code Blocks
```python
def hello_world():
    print("Hello from GenAI!")
```

### Tables

| Feature | Status |
|---------|--------|
| Bold | ✅ |
| Italic | ✅ |
| Lists | ✅ |
| Tables | ✅ |

## 💡 Example Commands

Try commands like:
- "Add a paragraph about machine learning after line 10"
- "Replace line 5 with a better introduction"  
- "Insert a code example at line 20"
- "Add a heading at line 1 saying 'My Document'"

---

*Happy editing!* 🎉"""
        
        sample_doc = Document(
            id="sample-doc-1",
            title="Welcome Document",
            content=sample_content
        )
        self._documents[sample_doc.id] = sample_doc
    
    def get_all(self) -> List[Document]:
        """Get all documents."""
        return list(self._documents.values())
    
    def get_by_id(self, document_id: str) -> Optional[Document]:
        """Get a document by ID."""
        return self._documents.get(document_id)
    
    def create(self, data: DocumentCreate) -> Document:
        """Create a new document."""
        document = Document(
            title=data.title,
            content=data.content
        )
        self._documents[document.id] = document
        return document
    
    def update(self, document_id: str, data: DocumentUpdate) -> Optional[Document]:
        """Update an existing document."""
        document = self._documents.get(document_id)
        if not document:
            return None
        
        if data.title is not None:
            document.title = data.title
        if data.content is not None:
            document.update_content(data.content)
        
        return document
    
    def delete(self, document_id: str) -> bool:
        """Delete a document."""
        if document_id in self._documents:
            del self._documents[document_id]
            return True
        return False
    
    def apply_edit(self, document_id: str, operation: str, line_start: int, 
                   line_end: Optional[int], new_content: str) -> Optional[Document]:
        """Apply an edit operation to a document."""
        document = self._documents.get(document_id)
        if not document:
            return None
        
        lines = document.content.split('\n')
        
        # Convert to 0-indexed
        start_idx = line_start - 1
        end_idx = (line_end - 1) if line_end else start_idx
        
        if operation == "insert":
            # Insert after the specified line
            new_lines = new_content.split('\n')
            lines = lines[:line_start] + new_lines + lines[line_start:]
        
        elif operation == "replace":
            # Replace lines from start to end
            new_lines = new_content.split('\n')
            lines = lines[:start_idx] + new_lines + lines[end_idx + 1:]
        
        elif operation == "delete":
            # Delete lines from start to end
            lines = lines[:start_idx] + lines[end_idx + 1:]
        
        document.update_content('\n'.join(lines))
        return document


# Singleton instance
document_service = DocumentService()
