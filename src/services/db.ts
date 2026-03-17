import Dexie, { Table } from 'dexie';

export interface Word {
  id: string;
  bookId: string;
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
  synced?: number; // 0 for false, 1 for true (Dexie handles numbers better for indexing)
  updatedAt?: number;
}

export interface VocabularyBook {
  id: string;
  name: string;
  synced?: number;
  updatedAt?: number;
}

export class LocalDatabase extends Dexie {
  books!: Table<VocabularyBook>;
  words!: Table<Word>;

  constructor() {
    super('VocabRunnerDB');
    this.version(1).stores({
      books: 'id, name',
      words: 'id, bookId, word, isLearned, testStatus'
    });
    this.version(2).stores({
      books: 'id, name, synced, updatedAt',
      words: 'id, bookId, word, isLearned, testStatus, synced, updatedAt'
    }).upgrade(async tx => {
      // Migrate existing books
      await tx.table('books').toCollection().modify(book => {
        if (book.synced === undefined) book.synced = 1; // Assume existing data was synced
        if (book.updatedAt === undefined) book.updatedAt = Date.now();
      });
      // Migrate existing words
      await tx.table('words').toCollection().modify(word => {
        if (word.synced === undefined) word.synced = 1;
        if (word.updatedAt === undefined) word.updatedAt = Date.now();
      });
    });
  }
}

export const db = new LocalDatabase();
