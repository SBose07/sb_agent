import type { StreamEvent } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export type StreamEventCallback = (event: StreamEvent) => void;

export async function streamChat(
    documentId: string,
    prompt: string,
    onEvent: StreamEventCallback,
    onComplete: () => void,
    onError: (error: Error) => void
): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/stream/${documentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                onComplete();
                break;
            }

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        onEvent(data as StreamEvent);
                    } catch (e) {
                        console.error('Failed to parse SSE event:', e);
                    }
                }
            }
        }
    } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
    }
}
