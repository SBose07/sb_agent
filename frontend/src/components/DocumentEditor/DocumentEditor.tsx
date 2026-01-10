import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Document } from '../../types';
import './DocumentEditor.css';

interface DocumentEditorProps {
    document: Document | null;
    highlightedLine: number | null;
}

type ViewMode = 'source' | 'preview' | 'split';

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
    document,
    highlightedLine,
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('split');

    const lines = useMemo(() => {
        if (!document) return [];
        return document.content.split('\n');
    }, [document?.content]);

    if (!document) {
        return (
            <div className="document-editor empty">
                <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <h3>No Document Selected</h3>
                    <p>Select a document from the sidebar or create a new one</p>
                </div>
            </div>
        );
    }

    return (
        <div className="document-editor">
            <div className="editor-header">
                <div className="header-left">
                    <h2 className="document-title">{document.title}</h2>
                    <span className="document-meta">
                        {lines.length} lines • Updated {new Date(document.updated_at).toLocaleString()}
                    </span>
                </div>
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'source' ? 'active' : ''}`}
                        onClick={() => setViewMode('source')}
                        title="Source view"
                    >
                        📝 Source
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
                        onClick={() => setViewMode('split')}
                        title="Split view"
                    >
                        ⚟ Split
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
                        onClick={() => setViewMode('preview')}
                        title="Preview"
                    >
                        👁️ Preview
                    </button>
                </div>
            </div>

            <div className={`editor-body ${viewMode}`}>
                {/* Source View */}
                {(viewMode === 'source' || viewMode === 'split') && (
                    <div className="source-panel">
                        <div className="panel-header">
                            <span>📝 Markdown Source</span>
                        </div>
                        <div className="editor-content">
                            <div className="line-numbers">
                                {lines.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`line-number ${highlightedLine === index + 1 ? 'highlighted' : ''}`}
                                    >
                                        {index + 1}
                                    </div>
                                ))}
                            </div>

                            <div className="lines-content">
                                {lines.map((line, index) => (
                                    <div
                                        key={index}
                                        className={`line ${highlightedLine === index + 1 ? 'highlighted' : ''}`}
                                    >
                                        <span className="line-text">{line || '\u00A0'}</span>
                                        {highlightedLine === index + 1 && (
                                            <span className="editing-indicator">
                                                <span className="pulse"></span>
                                                editing...
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview View */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className="preview-panel">
                        <div className="panel-header">
                            <span>👁️ Styled Preview</span>
                        </div>
                        <div className="preview-content markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {document.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
