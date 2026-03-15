import { db, VocabularyBook as LocalBook, Word as LocalWord } from './db';

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  sentence: string;
  isLearned: boolean;
  testStatus: 'untested' | 'mastered' | 'unmastered';
  lastLearnedAt?: string;
  lastTestedAt?: string;
  testSuccessCount?: number;
  testFailureCount?: number;
}

export interface VocabularyBook {
  id: string;
  name: string;
  words: Word[];
}

class StorageService {
  private isOnline: boolean = true;

  constructor() {
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    this.isOnline = navigator.onLine;
  }

  async getBooks(): Promise<VocabularyBook[]> {
    try {
      if (this.isOnline) {
        const res = await fetch(`/api/books?t=${Date.now()}`);
        if (res.ok) {
          const serverBooks: VocabularyBook[] = await res.json();
          if (Array.isArray(serverBooks)) {
            // Sync to local DB in background
            this.syncToLocal(serverBooks);
            return serverBooks;
          }
        }
      }
    } catch (e) {
      console.warn("Server unreachable, falling back to local storage", e);
    }

    // Fallback to local IndexedDB
    return this.getLocalBooks();
  }

  private async getLocalBooks(): Promise<VocabularyBook[]> {
    const localBooks = await db.books.toArray();
    const booksWithWords: VocabularyBook[] = [];

    for (const book of localBooks) {
      const words = await db.words.where('bookId').equals(book.id).toArray();
      booksWithWords.push({
        ...book,
        words: words.map(({ bookId, ...rest }) => rest as Word)
      });
    }

    return booksWithWords;
  }

  private async syncToLocal(serverBooks: VocabularyBook[]) {
    try {
      await db.transaction('rw', db.books, db.words, async () => {
        await db.books.clear();
        await db.words.clear();

        for (const book of serverBooks) {
          await db.books.put({ id: book.id, name: book.name });
          const wordsToPut = book.words.map(w => ({ ...w, bookId: book.id }));
          await db.words.bulkPut(wordsToPut);
        }
      });
    } catch (e) {
      console.error("Failed to sync server data to local DB", e);
    }
  }

  async saveBook(book: VocabularyBook): Promise<void> {
    // Save to local first (always available)
    try {
      await db.transaction('rw', db.books, db.words, async () => {
        await db.books.put({ id: book.id, name: book.name });
        const wordsToPut = book.words.map(w => ({ ...w, bookId: book.id }));
        await db.words.bulkPut(wordsToPut);
      });
    } catch (e) {
      console.error("Failed to save book to local DB", e);
    }

    // Then try server
    try {
      if (this.isOnline) {
        await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(book)
        });
      }
    } catch (e) {
      console.warn("Failed to save book to server, will sync later", e);
    }
  }

  async updateWord(bookId: string, word: Word): Promise<void> {
    // Update local
    try {
      await db.words.put({ ...word, bookId });
    } catch (e) {
      console.error("Failed to update word in local DB", e);
    }

    // Update server (currently we save the whole book, so we need to get the book first)
    // This is a bit inefficient but matches current backend. 
    // In a real app, we'd have a specific updateWord API.
    try {
      if (this.isOnline) {
        const res = await fetch(`/api/books?t=${Date.now()}`);
        if (res.ok) {
          const books: VocabularyBook[] = await res.json();
          const bookIndex = books.findIndex(b => b.id === bookId);
          if (bookIndex !== -1) {
            const wordIndex = books[bookIndex].words.findIndex(w => w.id === word.id);
            if (wordIndex !== -1) {
              books[bookIndex].words[wordIndex] = word;
              await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(books[bookIndex])
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to update word on server", e);
    }
  }

  async deleteBook(bookId: string): Promise<void> {
    // Delete local
    try {
      await db.transaction('rw', db.books, db.words, async () => {
        await db.books.delete(bookId);
        await db.words.where('bookId').equals(bookId).delete();
      });
    } catch (e) {
      console.error("Failed to delete book from local DB", e);
    }

    // Delete server
    try {
      if (this.isOnline) {
        await fetch(`/api/books?id=${bookId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn("Failed to delete book from server", e);
    }
  }

  async resetAll(): Promise<void> {
    // Clear local
    try {
      await db.transaction('rw', db.books, db.words, async () => {
        await db.books.clear();
        await db.words.clear();
      });
      localStorage.clear();
    } catch (e) {
      console.error("Failed to clear local DB", e);
    }

    // Clear server
    try {
      if (this.isOnline) {
        await fetch('/api/books', { method: 'DELETE' });
      }
    } catch (e) {
      console.warn("Failed to clear server data", e);
    }
  }
}

export const storageService = new StorageService();
