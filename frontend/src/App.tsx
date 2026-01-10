import { useCallback, useState } from 'react';
import { DocumentEditor } from './components/DocumentEditor/DocumentEditor';
import { ChatInterface } from './components/ChatInterface/ChatInterface';
import { useDocument } from './hooks/useDocument';
import { useChat } from './hooks/useChat';
import './App.css';

function App() {
  const {
    documents,
    currentDocument,
    isLoading,
    error,
    selectDocument,
    createDocument,
    deleteDocument,
    refreshCurrentDocument,
  } = useDocument();

  const {
    messages,
    isStreaming,
    highlightedLine,
    sendMessage,
    clearMessages,
  } = useChat(currentDocument?.id, refreshCurrentDocument);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleNewDocument = useCallback(async () => {
    const title = prompt('Enter document title:');
    if (title) {
      // Create empty document with just the title
      await createDocument({
        title,
        content: `# ${title}\n\n`
      });
    }
  }, [createDocument]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setDeleteConfirm(docId);
  }, []);

  const handleConfirmDelete = useCallback(async (docId: string) => {
    await deleteDocument(docId);
    setDeleteConfirm(null);
  }, [deleteDocument]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">✨</span>
          <h1>GenAI Document Editor</h1>
        </div>
        <div className="header-actions">
          <button className="new-doc-btn" onClick={handleNewDocument}>
            + New Document
          </button>
        </div>
      </header>

      <div className="app-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>Documents</h3>
            <span className="doc-count">{documents.length}</span>
          </div>
          <div className="documents-list">
            {isLoading && documents.length === 0 ? (
              <div className="loading">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="empty-docs">
                <p>No documents yet</p>
                <button onClick={handleNewDocument}>Create one</button>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`document-item ${currentDocument?.id === doc.id ? 'active' : ''}`}
                >
                  <button
                    className="doc-select-btn"
                    onClick={() => selectDocument(doc)}
                  >
                    <span className="doc-icon">📄</span>
                    <span className="doc-title">{doc.title}</span>
                  </button>

                  {deleteConfirm === doc.id ? (
                    <div className="delete-confirm">
                      <button
                        className="confirm-yes"
                        onClick={() => handleConfirmDelete(doc.id)}
                        title="Confirm delete"
                      >
                        ✓
                      </button>
                      <button
                        className="confirm-no"
                        onClick={handleCancelDelete}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      className="doc-delete-btn"
                      onClick={(e) => handleDeleteClick(e, doc.id)}
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="formatting-guide">
            <div className="guide-header">📝 Markdown Tips</div>
            <div className="guide-content">
              <code># Heading 1</code>
              <code>**bold**</code>
              <code>*italic*</code>
              <code>`code`</code>
              <code>- list item</code>
              <code>&gt; quote</code>
            </div>
          </div>
        </aside>

        {/* Main content area with split view */}
        <main className="main-area">
          <div className="split-view">
            {/* Document Editor */}
            <div className="editor-panel">
              <DocumentEditor
                document={currentDocument}
                highlightedLine={highlightedLine}
              />
            </div>

            {/* Chat Interface */}
            <div className="chat-panel">
              <ChatInterface
                messages={messages}
                isStreaming={isStreaming}
                onSendMessage={sendMessage}
                onClearMessages={clearMessages}
              />
            </div>
          </div>
        </main>
      </div>

      {error && (
        <div className="error-toast">
          <span>⚠️ {error}</span>
        </div>
      )}
    </div>
  );
}

export default App;
