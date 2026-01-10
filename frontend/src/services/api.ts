const API_BASE_URL = 'http://localhost:8000/api';

import type { Document, DocumentCreate, DocumentUpdate } from '../types';

// Document API functions
export async function getDocuments(): Promise<Document[]> {
    const response = await fetch(`${API_BASE_URL}/documents/`);
    if (!response.ok) {
        throw new Error('Failed to fetch documents');
    }
    return response.json();
}

export async function getDocument(id: string): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`);
    if (!response.ok) {
        throw new Error('Document not found');
    }
    return response.json();
}

export async function createDocument(data: DocumentCreate): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to create document');
    }
    return response.json();
}

export async function updateDocument(id: string, data: DocumentUpdate): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update document');
    }
    return response.json();
}

export async function deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete document');
    }
}
