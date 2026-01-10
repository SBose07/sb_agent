import json
import re
from typing import AsyncIterator, Optional
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from ..config import settings
from ..models.document import DocumentEdit, StreamEvent
from .document_service import document_service


class AgentState(TypedDict):
    """State for the LangGraph agent."""
    document_id: str
    document_content: str
    user_prompt: str
    parsed_intent: Optional[dict]
    generated_content: str
    edit_operation: Optional[DocumentEdit]
    response_tokens: list
    is_complete: bool
    error: Optional[str]


class LLMService:
    """LangGraph-based LLM service for document editing."""
    
    def __init__(self):
        self.model = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            streaming=True,
            temperature=0.7
        )
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow for document editing."""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("parse_intent", self._parse_intent)
        workflow.add_node("generate_content", self._generate_content)
        workflow.add_node("apply_edit", self._apply_edit)
        
        # Set entry point
        workflow.set_entry_point("parse_intent")
        
        # Add edges
        workflow.add_edge("parse_intent", "generate_content")
        workflow.add_edge("generate_content", "apply_edit")
        workflow.add_edge("apply_edit", END)
        
        return workflow.compile()
    
    async def _parse_intent(self, state: AgentState) -> AgentState:
        """Parse the user's intent from their prompt."""
        system_prompt = """You are a document editing assistant. Analyze the user's request and extract the editing intent.

Given the document content and user prompt, determine:
1. operation: "insert", "replace", or "delete"
2. line_start: The starting line number (1-indexed)
3. line_end: The ending line number (for multi-line operations, optional)
4. description: What content to generate

Respond ONLY with a JSON object in this exact format:
{"operation": "insert|replace|delete", "line_start": <number>, "line_end": <number or null>, "description": "what to generate"}

Example responses:
- For "Add a paragraph about AI after line 5": {"operation": "insert", "line_start": 5, "line_end": null, "description": "a paragraph about AI"}
- For "Replace lines 10-12 with a summary": {"operation": "replace", "line_start": 10, "line_end": 12, "description": "a summary"}
- For "Delete line 3": {"operation": "delete", "line_start": 3, "line_end": 3, "description": ""}"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"""Document content:
```
{state['document_content']}
```

User request: {state['user_prompt']}

Extract the intent as JSON:""")
        ]
        
        response = await self.model.ainvoke(messages)
        
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[^}]+\}', response.content)
            if json_match:
                intent = json.loads(json_match.group())
                state["parsed_intent"] = intent
            else:
                state["error"] = "Could not parse intent from response"
        except json.JSONDecodeError as e:
            state["error"] = f"JSON parse error: {str(e)}"
        
        return state
    
    async def _generate_content(self, state: AgentState) -> AgentState:
        """Generate the content to be inserted/replaced."""
        if state.get("error"):
            return state
        
        intent = state.get("parsed_intent", {})
        operation = intent.get("operation", "insert")
        
        if operation == "delete":
            state["generated_content"] = ""
            return state
        
        description = intent.get("description", "")
        line_start = intent.get("line_start", 1)
        
        # Get context around the target line
        lines = state["document_content"].split('\n')
        context_start = max(0, line_start - 3)
        context_end = min(len(lines), line_start + 2)
        context = '\n'.join(lines[context_start:context_end])
        
        system_prompt = """You are a document editing assistant. Generate content based on the user's request.
Write in a style consistent with the surrounding document context.
Respond ONLY with the content to be added, no explanations or markdown code blocks."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"""Context around line {line_start}:
```
{context}
```

Generate: {description}""")
        ]
        
        response = await self.model.ainvoke(messages)
        state["generated_content"] = response.content.strip()
        
        return state
    
    async def _apply_edit(self, state: AgentState) -> AgentState:
        """Create the edit operation."""
        if state.get("error"):
            return state
        
        intent = state.get("parsed_intent", {})
        
        state["edit_operation"] = DocumentEdit(
            operation=intent.get("operation", "insert"),
            line_start=intent.get("line_start", 1),
            line_end=intent.get("line_end"),
            new_content=state.get("generated_content", "")
        )
        
        state["is_complete"] = True
        return state
    
    async def process_edit_streaming(
        self, 
        document_id: str, 
        prompt: str
    ) -> AsyncIterator[StreamEvent]:
        """Process an edit request with streaming responses."""
        
        # Get the document
        document = document_service.get_by_id(document_id)
        if not document:
            yield StreamEvent(type="error", message=f"Document {document_id} not found")
            return
        
        # Emit thinking event
        yield StreamEvent(type="thinking", content="Analyzing your request...")
        
        # Parse intent
        system_prompt = """You are a document editing assistant. Analyze the user's request and extract the editing intent.

Given the document content and user prompt, determine:
1. operation: "insert", "replace", or "delete"
2. line_start: The starting line number (1-indexed)
3. line_end: The ending line number (for multi-line operations, optional)
4. description: What content to generate

Respond ONLY with a JSON object in this exact format:
{"operation": "insert|replace|delete", "line_start": <number>, "line_end": <number or null>, "description": "what to generate"}"""

        intent_messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"""Document content (with line numbers):
{self._add_line_numbers(document.content)}

User request: {prompt}

Extract the intent as JSON:""")
        ]
        
        intent_response = await self.model.ainvoke(intent_messages)
        
        try:
            json_match = re.search(r'\{[^}]+\}', intent_response.content)
            if not json_match:
                yield StreamEvent(type="error", message="Could not understand the request")
                return
            
            intent = json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError) as e:
            yield StreamEvent(type="error", message=f"Parse error: {str(e)}")
            return
        
        operation = intent.get("operation", "insert")
        line_start = intent.get("line_start", 1)
        line_end = intent.get("line_end")
        description = intent.get("description", "")
        
        # Emit highlight event
        yield StreamEvent(type="highlight", line=line_start)
        
        # For delete operation, skip content generation
        if operation == "delete":
            yield StreamEvent(type="token", content=f"Deleting line(s) {line_start}" + (f"-{line_end}" if line_end else ""))
            
            edit = DocumentEdit(
                operation="delete",
                line_start=line_start,
                line_end=line_end or line_start,
                new_content=""
            )
            
            # Apply edit
            document_service.apply_edit(
                document_id, 
                edit.operation, 
                edit.line_start, 
                edit.line_end, 
                edit.new_content
            )
            
            yield StreamEvent(type="edit", operation=edit)
            yield StreamEvent(type="done", summary=f"Deleted line(s) {line_start}" + (f"-{line_end}" if line_end else ""))
            return
        
        # Generate content with streaming
        yield StreamEvent(type="thinking", content=f"Generating content for {operation} at line {line_start}...")
        
        lines = document.content.split('\n')
        context_start = max(0, line_start - 5)
        context_end = min(len(lines), line_start + 4)
        context = '\n'.join(lines[context_start:context_end])
        
        generate_prompt = f"""You are a document editing assistant. Generate content based on the user's request.
Write in a style consistent with the document. Be concise and relevant.
Respond ONLY with the content to add, no explanations."""

        generate_messages = [
            SystemMessage(content=generate_prompt),
            HumanMessage(content=f"""Document context around line {line_start}:
```
{context}
```

User wants to {operation} at line {line_start}: {description}

Generate the content:""")
        ]
        
        # Stream the content generation
        generated_content = ""
        async for chunk in self.model.astream(generate_messages):
            if chunk.content:
                generated_content += chunk.content
                yield StreamEvent(type="token", content=chunk.content)
        
        # Clean up the generated content
        generated_content = generated_content.strip()
        
        # Create and emit edit operation
        edit = DocumentEdit(
            operation=operation,
            line_start=line_start,
            line_end=line_end,
            new_content=generated_content
        )
        
        # Apply the edit to the document
        document_service.apply_edit(
            document_id,
            edit.operation,
            edit.line_start,
            edit.line_end,
            edit.new_content
        )
        
        yield StreamEvent(type="edit", operation=edit)
        
        # Emit completion
        action_word = {"insert": "Inserted", "replace": "Replaced", "delete": "Deleted"}.get(operation, "Modified")
        yield StreamEvent(
            type="done", 
            summary=f"{action_word} content at line {line_start}"
        )
    
    def _add_line_numbers(self, content: str) -> str:
        """Add line numbers to content for better context."""
        lines = content.split('\n')
        return '\n'.join(f"{i+1}: {line}" for i, line in enumerate(lines))


# Singleton instance
llm_service = LLMService()
