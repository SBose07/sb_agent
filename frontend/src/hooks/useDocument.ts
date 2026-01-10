import { useState, useCallback, useEffect } from 'react';
import type { Document, DocumentCreate, DocumentUpdate } from '../types';
import * as api from '../services/api';

export function useDocument(initialDocumentId?: string) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all documents
    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const docs = await api.getDocuments();
            setDocuments(docs);
            return docs;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch documents');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch a specific document
    const fetchDocument = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const doc = await api.getDocument(id);
            setCurrentDocument(doc);
            // Also update the document in the list
            setDocuments(prev => prev.map(d => d.id === id ? doc : d));
            return doc;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch document');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Select a document (fetch fresh from server)
    const selectDocument = useCallback(async (doc: Document) => {
        // Fetch fresh content from server
        await fetchDocument(doc.id);
    }, [fetchDocument]);

    // Create a new document
    const createDocument = useCallback(async (data: DocumentCreate) => {
        setIsLoading(true);
        setError(null);
        try {
            const doc = await api.createDocument(data);
            setDocuments(prev => [...prev, doc]);
            setCurrentDocument(doc);
            return doc;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create document');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update document
    const updateDocument = useCallback(async (id: string, data: DocumentUpdate) => {
        setIsLoading(true);
        setError(null);
        try {
            const doc = await api.updateDocument(id, data);
            setDocuments(prev => prev.map(d => d.id === id ? doc : d));
            if (currentDocument?.id === id) {
                setCurrentDocument(doc);
            }
            return doc;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update document');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [currentDocument]);

    // Delete document
    const deleteDocument = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.deleteDocument(id);
            const newDocs = documents.filter(d => d.id !== id);
            setDocuments(newDocs);

            // If deleted document was selected, select first available
            if (currentDocument?.id === id) {
                if (newDocs.length > 0) {
                    setCurrentDocument(newDocs[0]);
                } else {
                    setCurrentDocument(null);
                }
            }
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete document');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentDocument, documents]);

    // Update document content locally (for streaming updates)
    const updateDocumentContent = useCallback((content: string) => {
        if (currentDocument) {
            const updated = { ...currentDocument, content };
            setCurrentDocument(updated);
            setDocuments(prev => prev.map(d => d.id === currentDocument.id ? updated : d));
        }
    }, [currentDocument]);

    // Refresh current document from server
    const refreshCurrentDocument = useCallback(async () => {
        if (currentDocument) {
            await fetchDocument(currentDocument.id);
        }
    }, [currentDocument, fetchDocument]);

    // Load documents on mount
    useEffect(() => {
        const loadInitial = async () => {
            const docs = await fetchDocuments();
            // Auto-select first document
            if (docs.length > 0 && !currentDocument) {
                setCurrentDocument(docs[0]);
            }
        };
        loadInitial();
    }, []);

    // Load specific document if ID provided
    useEffect(() => {
        if (initialDocumentId) {
            fetchDocument(initialDocumentId);
        }
    }, [initialDocumentId]);

    return {
        documents,
        currentDocument,
        isLoading,
        error,
        setCurrentDocument,
        selectDocument,
        fetchDocuments,
        fetchDocument,
        createDocument,
        updateDocument,
        deleteDocument,
        updateDocumentContent,
        refreshCurrentDocument,
    };
}
