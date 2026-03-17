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
  updatedAt?: number;
}

export interface VocabularyBook {
  id: string;
  name: string;
  words: Word[];
  updatedAt?: number;
  synced?: number;
}

class StorageService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log("App is online, triggering sync...");
      this.syncPendingChanges();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log("App is offline.");
    });
    this.isOnline = navigator.onLine;
    
    // Initial sync check
    if (this.isOnline) {
      this.syncPendingChanges();
    }
  }

  async getBooks(): Promise<VocabularyBook[]> {
    try {
      if (this.isOnline) {
        const res = await fetch(`/api/books?t=${Date.now()}`);
        if (res.ok) {
          const serverBooks: VocabularyBook[] = await res.json();
          if (Array.isArray(serverBooks)) {
            // Sync to local DB in background
            await this.syncToLocal(serverBooks);
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
        words: words.map(({ bookId, synced, ...rest }) => rest as Word)
      });
    }

    return booksWithWords;
  }

  private async syncToLocal(serverBooks: VocabularyBook[]) {
    try {
      // Get all local unsynced books to avoid overwriting them
      const unsyncedBooks = await db.books.where('synced').equals(0).toArray();
      const unsyncedIds = new Set(unsyncedBooks.map(b => b.id));

      await db.transaction('rw', db.books, db.words, async () => {
        for (const book of serverBooks) {
          // Skip if local has unsynced changes for this book
          if (unsyncedIds.has(book.id)) continue;

          await db.books.put({ 
            id: book.id, 
            name: book.name, 
            updatedAt: book.updatedAt || Date.now(),
            synced: 1 
          });
          
          const wordsToPut = book.words.map(w => ({ 
            ...w, 
            bookId: book.id,
            synced: 1,
            updatedAt: w.updatedAt || Date.now()
          }));
          await db.words.bulkPut(wordsToPut);
        }

        // Also remove local books that are no longer on server (unless unsynced)
        const serverIds = new Set(serverBooks.map(b => b.id));
        const localBooks = await db.books.toArray();
        for (const localBook of localBooks) {
          if (!serverIds.has(localBook.id) && localBook.synced !== 0) {
            await db.books.delete(localBook.id);
            await db.words.where('bookId').equals(localBook.id).delete();
          }
        }
      });
    } catch (e) {
      console.error("Failed to sync server data to local DB", e);
    }
  }

  async saveBook(book: VocabularyBook): Promise<void> {
    const now = Date.now();
    const bookWithMeta = { ...book, updatedAt: now, synced: 0 };

    // Save to local first (always available)
    try {
      await db.transaction('rw', db.books, db.words, async () => {
        await db.books.put({ 
          id: bookWithMeta.id, 
          name: bookWithMeta.name, 
          updatedAt: now, 
          synced: 0 
        });
        const wordsToPut = bookWithMeta.words.map(w => ({ 
          ...w, 
          bookId: bookWithMeta.id,
          updatedAt: w.updatedAt || now,
          synced: 0
        }));
        await db.words.bulkPut(wordsToPut);
      });
    } catch (e) {
      console.error("Failed to save book to local DB", e);
    }

    // Then try server
    if (this.isOnline) {
      await this.pushBookToServer(bookWithMeta);
    }
  }

  private async pushBookToServer(book: VocabularyBook): Promise<boolean> {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book)
      });
      
      if (res.ok) {
        // Mark as synced locally
        await db.transaction('rw', db.books, db.words, async () => {
          await db.books.update(book.id, { synced: 1 });
          await db.words.where('bookId').equals(book.id).modify({ synced: 1 });
        });
        return true;
      }
    } catch (e) {
      console.warn(`Failed to push book ${book.id} to server`, e);
    }
    return false;
  }

  async syncPendingChanges() {
    if (this.syncInProgress || !this.isOnline) return;
    this.syncInProgress = true;

    try {
      const pendingBooks = await db.books.where('synced').equals(0).toArray();
      console.log(`Syncing ${pendingBooks.length} pending books...`);
      
      for (const bookMeta of pendingBooks) {
        const words = await db.words.where('bookId').equals(bookMeta.id).toArray();
        const fullBook: VocabularyBook = {
          ...bookMeta,
          words: words.map(({ bookId, synced, ...rest }) => rest as Word)
        };
        await this.pushBookToServer(fullBook);
      }
    } catch (e) {
      console.error("Background sync failed", e);
    } finally {
      this.syncInProgress = false;
    }
  }

  async updateWord(bookId: string, word: Word): Promise<void> {
    const now = Date.now();
    const wordWithMeta = { ...word, updatedAt: now, synced: 0 };

    // Update local
    try {
      await db.transaction('rw', db.books, db.words, async () => {
        await db.words.put({ ...wordWithMeta, bookId });
        await db.books.update(bookId, { synced: 0, updatedAt: now });
      });
    } catch (e) {
      console.error("Failed to update word in local DB", e);
    }

    // If online, push the whole book (current server limitation)
    if (this.isOnline) {
      const books = await this.getLocalBooks();
      const book = books.find(b => b.id === bookId);
      if (book) {
        await this.pushBookToServer(book);
      }
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
    if (this.isOnline) {
      try {
        await fetch(`/api/books?id=${bookId}`, { method: 'DELETE' });
      } catch (e) {
        console.warn("Failed to delete book from server", e);
      }
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
    if (this.isOnline) {
      try {
        await fetch('/api/books', { method: 'DELETE' });
      } catch (e) {
        console.warn("Failed to clear server data", e);
      }
    }
  }
}

export const storageService = new StorageService();
