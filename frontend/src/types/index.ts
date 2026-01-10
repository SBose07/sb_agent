// Document types
export interface DocumentLine {
    line_number: number;
    content: string;
}

export interface Document {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentCreate {
    title: string;
    content?: string;
}

export interface DocumentUpdate {
    title?: string;
    content?: string;
}

// Edit operation types
export interface DocumentEdit {
    operation: 'insert' | 'replace' | 'delete';
    line_start: number;
    line_end?: number;
    new_content: string;
}

// Streaming event types
export type StreamEventType =
    | 'token'
    | 'thinking'
    | 'edit'
    | 'highlight'
    | 'done'
    | 'error';

export interface StreamEvent {
    type: StreamEventType;
    content?: string;
    operation?: DocumentEdit;
    line?: number;
    summary?: string;
    message?: string;
}

// Chat types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

export interface ChatRequest {
    prompt: string;
}

// App state types
export interface AppState {
    documents: Document[];
    currentDocument: Document | null;
    isLoading: boolean;
    error: string | null;
}
