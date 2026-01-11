import { useCallback, useState, useRef } from 'react';
import { DocumentEditor } from './components/DocumentEditor/DocumentEditor';
import { ChatInterface } from './components/ChatInterface/ChatInterface';
import { useDocument } from './hooks/useDocument';
import { useChat } from './hooks/useChat';
import './App.css';

const API_BASE_URL = 'http://localhost:8000/api';

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
    fetchDocuments,
  } = useDocument();

  const {
    messages,
    isStreaming,
    highlightedLine,
    sendMessage,
    clearMessages,
  } = useChat(currentDocument?.id, refreshCurrentDocument);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewDocument = useCallback(async () => {
    const title = prompt('Enter document title:');
    if (title) {
      await createDocument({
        title,
        content: ''
      });
    }
  }, [createDocument]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('Please upload a .docx file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const doc = await response.json();
      await fetchDocuments();
      selectDocument(doc);
    } catch (err) {
      alert('Error uploading file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [fetchDocuments, selectDocument]);

  const handleDownload = useCallback(async (docId: string, docTitle: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${docId}/download`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error downloading file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, []);

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
      </header>

      <div className="app-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>Documents</h3>
            <div className="sidebar-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".docx"
                style={{ display: 'none' }}
              />
              <button
                className="sidebar-icon-btn"
                onClick={handleUploadClick}
                title="Upload .docx file"
              >
                📤
              </button>
              <button
                className="sidebar-icon-btn"
                onClick={handleNewDocument}
                title="New document"
              >
                ➕
              </button>
            </div>
          </div>
          <div className="documents-list">
            {isLoading && documents.length === 0 ? (
              <div className="loading">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="empty-docs">
                <p>No documents yet</p>
                <div className="empty-actions">
                  <button onClick={handleNewDocument} title="New document">➕ New</button>
                  <button onClick={handleUploadClick} title="Upload .docx">📤 Upload</button>
                </div>
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

                  <div className="doc-actions">
                    <button
                      className="doc-action-btn download"
                      onClick={(e) => handleDownload(doc.id, doc.title, e)}
                      title="Download as .docx"
                    >
                      📥
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
                        className="doc-action-btn delete"
                        onClick={(e) => handleDeleteClick(e, doc.id)}
                        title="Delete document"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
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
