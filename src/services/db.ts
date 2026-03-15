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
}

export interface VocabularyBook {
  id: string;
  name: string;
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
  }
}

export const db = new LocalDatabase();
