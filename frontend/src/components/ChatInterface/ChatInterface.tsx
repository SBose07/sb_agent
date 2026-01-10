import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import './ChatInterface.css';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    isStreaming: boolean;
    onSendMessage: (message: string) => void;
    onClearMessages: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    isStreaming,
    onSendMessage,
    onClearMessages,
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isStreaming) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <div className="chat-title">
                    <span className="chat-icon">🤖</span>
                    <span>AI Assistant</span>
                </div>
                <button
                    className="clear-btn"
                    onClick={onClearMessages}
                    disabled={messages.length === 0}
                    title="Clear chat history"
                >
                    🗑️
                </button>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <div className="empty-chat-icon">💬</div>
                        <h3>Start a Conversation</h3>
                        <p>Ask me to edit your document. For example:</p>
                        <div className="suggestions">
                            <button
                                className="suggestion"
                                onClick={() => setInput('Add a title at line 1 saying "My Document"')}
                            >
                                Add a title at line 1
                            </button>
                            <button
                                className="suggestion"
                                onClick={() => setInput('Insert a paragraph about AI after line 5')}
                            >
                                Insert a paragraph about AI
                            </button>
                            <button
                                className="suggestion"
                                onClick={() => setInput('Replace line 3 with a better introduction')}
                            >
                                Replace line 3
                            </button>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${message.role} ${message.isStreaming ? 'streaming' : ''}`}
                        >
                            <div className="message-avatar">
                                {message.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="message-content">
                                <div className="message-text">
                                    {message.content || (message.isStreaming && (
                                        <span className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </span>
                                    ))}
                                </div>
                                <div className="message-time">
                                    {message.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <div className="input-container">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me to edit your document..."
                        disabled={isStreaming}
                        rows={1}
                    />
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={!input.trim() || isStreaming}
                    >
                        {isStreaming ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            '➤'
                        )}
                    </button>
                </div>
                <div className="input-hint">
                    Press Enter to send, Shift+Enter for new line
                </div>
            </form>
        </div>
    );
};
