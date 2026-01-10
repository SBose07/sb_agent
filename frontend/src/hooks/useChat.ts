import { useState, useCallback, useRef } from 'react';
import type { StreamEvent, ChatMessage } from '../types';
import { streamChat } from '../services/streaming';

export function useChat(
    documentId: string | undefined,
    onDocumentUpdate: () => void
) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
    const [streamingContent, setStreamingContent] = useState('');
    const abortRef = useRef(false);

    const sendMessage = useCallback(async (prompt: string) => {
        if (!documentId || isStreaming) return;

        abortRef.current = false;
        setIsStreaming(true);
        setStreamingContent('');
        setHighlightedLine(null);

        // Add user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: prompt,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        // Add placeholder for assistant message
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
        };
        setMessages(prev => [...prev, assistantMessage]);

        let fullContent = '';

        await streamChat(
            documentId,
            prompt,
            // onEvent
            (event: StreamEvent) => {
                if (abortRef.current) return;

                switch (event.type) {
                    case 'token':
                        if (event.content) {
                            fullContent += event.content;
                            setStreamingContent(fullContent);
                            setMessages(prev =>
                                prev.map(m =>
                                    m.id === assistantMessageId
                                        ? { ...m, content: fullContent }
                                        : m
                                )
                            );
                        }
                        break;

                    case 'thinking':
                        if (event.content) {
                            setMessages(prev =>
                                prev.map(m =>
                                    m.id === assistantMessageId
                                        ? { ...m, content: `*${event.content}*` }
                                        : m
                                )
                            );
                        }
                        break;

                    case 'highlight':
                        if (event.line) {
                            setHighlightedLine(event.line);
                        }
                        break;

                    case 'edit':
                        // Document has been edited, trigger refresh
                        onDocumentUpdate();
                        break;

                    case 'done':
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === assistantMessageId
                                    ? {
                                        ...m,
                                        content: fullContent + (event.summary ? `\n\n✓ ${event.summary}` : ''),
                                        isStreaming: false
                                    }
                                    : m
                            )
                        );
                        break;

                    case 'error':
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === assistantMessageId
                                    ? {
                                        ...m,
                                        content: `❌ Error: ${event.message}`,
                                        isStreaming: false
                                    }
                                    : m
                            )
                        );
                        break;
                }
            },
            // onComplete
            () => {
                setIsStreaming(false);
                setStreamingContent('');
                setTimeout(() => setHighlightedLine(null), 2000);
            },
            // onError
            (error: Error) => {
                console.error('Streaming error:', error);
                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantMessageId
                            ? {
                                ...m,
                                content: `❌ Error: ${error.message}`,
                                isStreaming: false
                            }
                            : m
                    )
                );
                setIsStreaming(false);
                setStreamingContent('');
            }
        );
    }, [documentId, isStreaming, onDocumentUpdate]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setHighlightedLine(null);
    }, []);

    const stopStreaming = useCallback(() => {
        abortRef.current = true;
        setIsStreaming(false);
    }, []);

    return {
        messages,
        isStreaming,
        highlightedLine,
        streamingContent,
        sendMessage,
        clearMessages,
        stopStreaming,
    };
}
