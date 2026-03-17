import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Settings, Upload, BookOpen, CheckCircle2, ChevronDown, ArrowLeft, Check, X, Volume2, Trash2, Globe } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db } from './services/db';
import { storageService, VocabularyBook, Word } from './services/storageService';

// Define types for our data
// (Keeping local interfaces for compatibility if needed, but using service types)

interface AppSettings {
  showPhoneticInTest: boolean;
}

const APP_ICON_DATA_URI = "/public/logo.png"


// Default sample word book data
const defaultSampleBook: VocabularyBook = {
  id: 'sample-book-001',
  name: '默认示例单词本',
  words: [
    { id: '1', word: 'ability', phonetic: '/əˈbɪləti/', meaning: 'n. 能力；本领', sentence: 'Sue has the ability to succeed in business.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '2', word: 'able', phonetic: '/ˈeɪbl/', meaning: 'adj. 能够的；有能力的', sentence: 'Leave the reference books behind, or you won\'t be able to think by yourself.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '3', word: 'about', phonetic: '/əˈbaʊt/', meaning: 'adv. 大约；到处 prep. 关于', sentence: 'It takes about half an hour to ride from this park to Shanghai Museum.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '4', word: 'above', phonetic: '/əˈbʌv/', meaning: 'prep. 在……上面 adv. 在上面', sentence: 'There is a bridge above the river.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '5', word: 'abroad', phonetic: '/əˈbrɔːd/', meaning: 'adv. 到（在）国外', sentence: 'He had to make a choice between staying with his parents and going abroad.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '6', word: 'accept', phonetic: '/əkˈsept/', meaning: 'v. 接受；同意', sentence: 'They accepted responsibility for the accident.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '7', word: 'accident', phonetic: '/ˈæksɪdənt/', meaning: 'n. 事故；意外', sentence: 'He was injured in a traffic accident.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '8', word: 'accurate', phonetic: '/ˈækjərət/', meaning: 'adj. 准确的', sentence: 'The manager impressed on his office staff the importance of keeping accurate records.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '9', word: 'ache', phonetic: '/eɪk/', meaning: 'n. 疼；痛', sentence: 'She could feel an ache in her back.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '10', word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 达到；取得', sentence: 'As an English learner, the larger vocabulary you have, the more success you may achieve.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '11', word: 'across', phonetic: '/əˈkrɒs/', meaning: 'prep.&adv. 穿过；横过', sentence: 'She ran across the field to catch up with her friends.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '12', word: 'act', phonetic: '/ækt/', meaning: 'v. 扮演；行动 n. 行为', sentence: 'His selfless act of kindness touched everyone\'s heart.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '13', word: 'active', phonetic: '/ˈæktɪv/', meaning: 'adj. 积极的；活跃的', sentence: 'They took an active part in the singing competition yesterday.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '14', word: 'activity', phonetic: '/ækˈtɪvəti/', meaning: 'n. 活动', sentence: 'The Japanese held different kinds of activities to commemorate the one-year anniversary.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '15', word: 'actor', phonetic: '/ˈæktə(r)/', meaning: 'n. 男演员', sentence: 'Nowadays too many boys want to become actors.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '16', word: 'actress', phonetic: '/ˈæktrəs/', meaning: 'n. 女演员', sentence: 'Emma, an actress, has become a superstar because of her hard work and talent.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '17', word: 'actually', phonetic: '/ˈæktʃuəli/', meaning: 'adv. 实际上；事实上', sentence: 'He seems to be doing nothing, but actually he is waiting for a chance.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '18', word: 'add', phonetic: '/æd/', meaning: 'v. 添加；增加', sentence: 'Don\'t add too much salt to the soup, or it will be too salty.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '19', word: 'addition', phonetic: '/əˈdɪʃn/', meaning: 'n. 增加', sentence: 'Ann will be a very useful addition to our team.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 },
    { id: '20', word: 'address', phonetic: '/əˈdres/', meaning: 'n. 地址', sentence: 'Will you please repeat your e-mail address? I\'ll write it down.', isLearned: false, testStatus: 'untested', testSuccessCount: 0, testFailureCount: 0 }
  ]
};

export default function App() {
  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<'home' | 'learning' | 'testing' | 'settings'>('home');

  // State for the currently selected batch size
  const [batchSize, setBatchSize] = useState<number>(20);
  
  // State for all imported books
  const [books, setBooks] = useState<VocabularyBook[]>([]);
  
  // State for the currently selected book ID
  const [currentBookId, setCurrentBookId] = useState<string>('');

  // App settings
  const [settings, setSettings] = useState<AppSettings>({
    showPhoneticInTest: false,
  });

  // Session state (for learning/testing)
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Testing specific state
  const [testInput, setTestInput] = useState<string>('');
  const [testFeedback, setTestFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingBook, setPendingBook] = useState<VocabularyBook | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [serverIp, setServerIp] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const initialBooks = await storageService.getBooks();
        
        let booksToSet = initialBooks;

        // Ensure the default sample book is always present if no books were loaded
        const hasSampleBook = booksToSet.some(b => b.id === defaultSampleBook.id);
        if (!hasSampleBook) {
          booksToSet = [defaultSampleBook, ...booksToSet];
          // Save the sample book so it persists
          storageService.saveBook(defaultSampleBook);
        }

        setBooks(booksToSet);
        if (booksToSet.length > 0) {
          setCurrentBookId(booksToSet[0].id);
        }
      } catch (e) {
        console.error("Failed to load books", e);
        // Fallback to sample book
        setBooks([defaultSampleBook]);
        setCurrentBookId(defaultSampleBook.id);
      }
    };

    loadBooks();

    // Restore session state
    const savedSession = localStorage.getItem('vocab_runner_session');
    if (savedSession) {
      try {
        const { screen, bookId, index } = JSON.parse(savedSession);
        if (screen) setCurrentScreen(screen);
        if (bookId) setCurrentBookId(bookId);
        if (typeof index === 'number') setCurrentIndex(index);
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }

    const savedSettings = localStorage.getItem('wordrunner_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wordrunner_settings', JSON.stringify(settings));
  }, [settings]);

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    const sessionState = {
      screen: currentScreen,
      bookId: currentBookId,
      index: currentIndex
    };
    localStorage.setItem('vocab_runner_session', JSON.stringify(sessionState));
  }, [currentScreen, currentBookId, currentIndex]);

  // Derived state for the current book
  const currentBook = books.find(b => b.id === currentBookId) || null;

  // Calculate stats for the current book
  const totalWords = currentBook?.words.length || 0;
  const learnedWords = currentBook?.words.filter(w => w.isLearned).length || 0;
  const passedWords = currentBook?.words.filter(w => w.testStatus === 'mastered').length || 0;

  // Generate word cloud words (up to 20 words, matching test selection criteria)
  const wordCloudWords = useMemo(() => {
    if (!currentBook) return [];
    
    const targetSize = 20;
    const halfSize = Math.floor(targetSize / 2);
    
    // 1. Recently learned words
    const recentlyLearned = [...currentBook.words]
      .filter(w => w.isLearned)
      .sort((a, b) => {
        const timeA = a.lastLearnedAt ? new Date(a.lastLearnedAt).getTime() : 0;
        const timeB = b.lastLearnedAt ? new Date(b.lastLearnedAt).getTime() : 0;
        return timeB - timeA;
      });
    
    // 2. High failure count words (not mastered)
    const highFailure = [...currentBook.words]
      .filter(w => w.testStatus !== 'mastered')
      .sort((a, b) => (b.testFailureCount || 0) - (a.testFailureCount || 0));

    let selectedIds = new Set<string>();
    let cloudWords: Word[] = [];

    // Pick half from recently learned
    let count = 0;
    for (const word of recentlyLearned) {
      if (count < halfSize) {
        cloudWords.push(word);
        selectedIds.add(word.id);
        count++;
      } else break;
    }

    // Fill the rest from high failure
    for (const word of highFailure) {
      if (!selectedIds.has(word.id) && cloudWords.length < targetSize) {
        cloudWords.push(word);
        selectedIds.add(word.id);
      }
    }

    // If still not enough, fill with anything else
    if (cloudWords.length < targetSize) {
      const remaining = currentBook.words.filter(w => !selectedIds.has(w.id));
      for (const word of remaining) {
        if (cloudWords.length < targetSize) {
          cloudWords.push(word);
          selectedIds.add(word.id);
        } else break;
      }
    }
    
    // Shuffle for visual variety
    return [...cloudWords].sort(() => Math.random() - 0.5);
  }, [currentBook]);

  // Available batch sizes
  const batchOptions = [20, 50, 80, 100];

  // --- Text-to-Speech Logic ---
  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Default to US English
      utterance.rate = 0.9; // Slightly slower for clarity
      
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.includes('en-US') || voice.lang.includes('en-GB')
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  // Ensure voices are loaded (some browsers load them asynchronously)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Helper to get display name (Requirement 3: only show part before first '_')
  const getDisplayName = (name: string) => {
    const index = name.indexOf('_');
    return index === -1 ? name : name.substring(0, index);
  };

  const processImportedData = (fileName: string, data: any[]) => {
    let baseName = fileName.replace(/\.[^/.]+$/, "");
    
    // (2.1) Filename的第一个字符不可以是“_"
    if (baseName.startsWith('_')) {
      alert("文件名第一个字符不可以是 '_'");
      return;
    }

    // (3) 如果文件名中有 "_"，则截断，只保留 "_" 以前的字符串
    const underscoreIndex = baseName.indexOf('_');
    const finalName = underscoreIndex === -1 ? baseName : baseName.substring(0, underscoreIndex);

    const words: Word[] = data.map((row, index) => {
      const wordText = row['单词'] || row['word'] || row[1] || '';
      if (!wordText) return null;

      return {
        id: String(row['ID'] || row['id'] || row[0] || index),
        word: String(wordText).trim(),
        phonetic: String(row['音标'] || row['phonetic'] || row[2] || '').trim(),
        meaning: String(row['中文解释'] || row['meaning'] || row[3] || '').trim(),
        sentence: String(row['例句'] || row['sentence'] || row[4] || '').trim(),
        isLearned: row['isLearned'] === true || row['isLearned'] === 'true',
        testStatus: (row['testStatus'] as any) || 'untested',
        lastLearnedAt: row['lastLearnedAt'],
        lastTestedAt: row['lastTestedAt'],
        testSuccessCount: Number(row['testSuccessCount']) || 0,
        testFailureCount: Number(row['testFailureCount']) || 0
      };
    }).filter(Boolean) as Word[];

    if (words.length === 0) {
      alert("No valid words found in the file. Please check the format.");
      return;
    }

    const newBook: VocabularyBook = {
      id: finalName, // (1) 对应服务器上的 Filename.json
      name: finalName, // (3) 下拉框显示的名称
      words: words,
    };

    // (2.2) 如果已经有相同名称的单词表,则提示用户是否覆盖已有单词表
    const existingBook = books.find(b => b.id === newBook.id);
    if (existingBook) {
      setPendingBook(newBook);
      setShowOverwriteConfirm(true);
    } else {
      saveNewBook(newBook);
    }
  };

  const saveNewBook = (book: VocabularyBook) => {
    setBooks(prev => {
      // Remove existing book with same ID if any (for overwrite)
      const filtered = prev.filter(b => b.id !== book.id);
      return [...filtered, book];
    });
    setCurrentBookId(book.id);
    storageService.saveBook(book);
  };

  const confirmOverwrite = () => {
    if (pendingBook) {
      saveNewBook(pendingBook);
      setPendingBook(null);
    }
    setShowOverwriteConfirm(false);
  };

  const cancelOverwrite = () => {
    setPendingBook(null);
    setShowOverwriteConfirm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processImportedData(file.name, results.data);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          alert("Failed to parse CSV file.");
        }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        processImportedData(file.name, data);
      } catch (error) {
        console.error("Excel parsing error:", error);
        alert("Failed to parse Excel file.");
      }
    } else {
      alert("Unsupported file format. Please upload a CSV or Excel file.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSyncFromServer = async () => {
    if (!serverIp.trim()) return;
    setIsSyncing(true);
    try {
      const targetUrl = `http://${serverIp.trim()}:3000/api/books`;
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Failed to fetch from server');
      const remoteBooks: VocabularyBook[] = await response.json();
      
      if (Array.isArray(remoteBooks) && remoteBooks.length > 0) {
        // Save each book to local storage and current server
        for (const book of remoteBooks) {
          await storageService.saveBook(book);
        }
        
        // Refresh local state
        const updatedBooks = await storageService.getBooks();
        setBooks(updatedBooks);
        if (updatedBooks.length > 0) {
          setCurrentBookId(updatedBooks[0].id);
        }
        alert(`成功同步 ${remoteBooks.length} 个单词本`);
      } else {
        alert('服务器上没有找到单词本');
      }
    } catch (e) {
      console.error("Sync failed:", e);
      alert("同步失败，请检查服务器地址和网络连接。确保目标服务器已开启并允许跨域访问。");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // 1. 清除所有存储（服务器和本地）
      await storageService.resetAll();
      
      // 2. 准备一个干净的示例单词本
      const freshSampleBook = JSON.parse(JSON.stringify(defaultSampleBook));
      
      // 3. 将干净的示例本保存
      await storageService.saveBook(freshSampleBook);
      
      // 4. 强制刷新页面以清空所有 React 状态
      window.location.href = '/'; 
    } catch (e) {
      console.error("Failed to reset app", e);
      alert("重置失败，请稍后重试。");
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  // --- Learning Logic ---
  const startLearning = () => {
    if (!currentBook) return;
    
    // Select unlearned words first
    let unlearned = currentBook.words.filter(w => !w.isLearned);
    
    // Shuffle unlearned words to pick randomly and evenly
    unlearned = unlearned.sort(() => Math.random() - 0.5);
    
    let wordsToLearn = unlearned.slice(0, batchSize);
    
    // If not enough unlearned words, add some already learned ones (also shuffled)
    if (wordsToLearn.length < batchSize) {
      let learned = currentBook.words.filter(w => w.isLearned);
      learned = learned.sort(() => Math.random() - 0.5);
      const remaining = batchSize - wordsToLearn.length;
      wordsToLearn = [...wordsToLearn, ...learned.slice(0, remaining)];
    }

    if (wordsToLearn.length === 0) {
      alert("No words available to learn.");
      return;
    }

    setSessionWords(wordsToLearn);
    setCurrentIndex(0);
    setCurrentScreen('learning');
    
    // Auto-pronounce the first word
    setTimeout(() => {
      speakWord(wordsToLearn[0].word);
    }, 500);
  };

  const markAsLearned = () => {
    if (!currentBook) return;
    
    const currentWord = sessionWords[currentIndex];
    const now = new Date().toISOString();
    
    // Update the book's word status
    const updatedBook = {
      ...currentBook,
      words: currentBook.words.map(w => 
        w.id === currentWord.id ? { ...w, isLearned: true, lastLearnedAt: now } : w
      )
    };
    
    const updatedBooks = books.map(book => 
      book.id === currentBookId ? updatedBook : book
    );
    
    setBooks(updatedBooks);
    storageService.saveBook(updatedBook);
    nextWord();
  };

  // --- Testing Logic ---
  const startTesting = () => {
    if (!currentBook) return;
    
    const halfSize = Math.floor(batchSize / 2);
    
    // 1. Recently learned words (isLearned === true)
    const recentlyLearned = [...currentBook.words]
      .filter(w => w.isLearned)
      .sort((a, b) => {
        const timeA = a.lastLearnedAt ? new Date(a.lastLearnedAt).getTime() : 0;
        const timeB = b.lastLearnedAt ? new Date(b.lastLearnedAt).getTime() : 0;
        return timeB - timeA;
      });
    
    // 2. High failure count words (not mastered)
    const highFailure = [...currentBook.words]
      .filter(w => w.testStatus !== 'mastered')
      .sort((a, b) => (b.testFailureCount || 0) - (a.testFailureCount || 0));

    // Selection process
    let selectedIds = new Set<string>();
    let wordsToTest: Word[] = [];

    // Try to pick half from recently learned
    let count = 0;
    for (const word of recentlyLearned) {
      if (count < halfSize) {
        wordsToTest.push(word);
        selectedIds.add(word.id);
        count++;
      } else break;
    }

    // Fill the rest (or at least the other half) from high failure
    count = 0;
    const targetHighFailureCount = batchSize - wordsToTest.length;
    for (const word of highFailure) {
      if (!selectedIds.has(word.id) && wordsToTest.length < batchSize) {
        wordsToTest.push(word);
        selectedIds.add(word.id);
      }
    }

    // If still not enough, fill with anything not mastered that wasn't selected
    if (wordsToTest.length < batchSize) {
      const remainingCandidates = currentBook.words.filter(w => w.testStatus !== 'mastered' && !selectedIds.has(w.id));
      for (const word of remainingCandidates) {
        if (wordsToTest.length < batchSize) {
          wordsToTest.push(word);
          selectedIds.add(word.id);
        } else break;
      }
    }

    if (wordsToTest.length === 0) {
      alert("No words available to test. Try learning some words first!");
      return;
    }

    // Shuffle words for testing
    wordsToTest = wordsToTest.sort(() => Math.random() - 0.5);

    setSessionWords(wordsToTest);
    setCurrentIndex(0);
    setTestInput('');
    setTestFeedback('none');
    setShowHint(settings.showPhoneticInTest);
    setCurrentScreen('testing');
    
    // Focus input on next render
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const checkAnswer = () => {
    if (!currentBook || !testInput.trim()) return;
    
    const currentWord = sessionWords[currentIndex];
    const isCorrect = testInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    
    if (isCorrect) {
      setTestFeedback('correct');
      // Update status
      updateWordTestStatus(currentWord.id, true);
      
      // Pronounce the word when correct
      speakWord(currentWord.word);
      
      // Auto advance after a short delay
      setTimeout(() => {
        nextWord();
      }, 1000); // Slightly longer delay to hear the pronunciation
    } else {
      setTestFeedback('incorrect');
      setShowHint(true); // Show phonetic hint if they get it wrong
      // Update status
      updateWordTestStatus(currentWord.id, false);
      
      // Pronounce the word as a hint when incorrect
      speakWord(currentWord.word);
    }
  };

  const updateWordTestStatus = (wordId: string, isSuccess: boolean) => {
    const bookToUpdate = books.find(b => b.id === currentBookId);
    if (!bookToUpdate) return;

    const now = new Date().toISOString();
    let updatedWord: Word | null = null;

    const updatedBook = {
      ...bookToUpdate,
      words: bookToUpdate.words.map(w => {
        if (w.id === wordId) {
          const newSuccessCount = (w.testSuccessCount || 0) + (isSuccess ? 1 : 0);
          const newFailureCount = (w.testFailureCount || 0) + (isSuccess ? 0 : 1);
          
          // Only mark as mastered if success count is 2 or more
          const newStatus = isSuccess && newSuccessCount >= 2 ? 'mastered' : 'unmastered';

          updatedWord = { 
            ...w, 
            testStatus: newStatus,
            lastTestedAt: now,
            testSuccessCount: newSuccessCount,
            testFailureCount: newFailureCount
          };
          return updatedWord;
        }
        return w;
      })
    };

    const updatedBooks = books.map(book => 
      book.id === currentBookId ? updatedBook : book
    );
    
    setBooks(updatedBooks);
    
    // Update sessionWords so the UI reflects changes immediately
    if (updatedWord) {
      setSessionWords(prev => prev.map(w => w.id === wordId ? updatedWord! : w));
    }
    
    storageService.saveBook(updatedBook);
  };

  const skipTestWord = () => {
    const currentWord = sessionWords[currentIndex];
    updateWordTestStatus(currentWord.id, false);
    nextWord();
  };

  const nextWord = () => {
    if (currentIndex < sessionWords.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setTestInput('');
      setTestFeedback('none');
      setShowHint(settings.showPhoneticInTest);
      
      // Auto-pronounce in learning mode
      if (currentScreen === 'learning') {
        setTimeout(() => {
          speakWord(sessionWords[nextIndex].word);
        }, 300);
      }
      
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Session complete
      alert("Session complete!");
      setCurrentScreen('home');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (testFeedback === 'incorrect') {
        // If they already got it wrong and press enter again, clear it to try again
        setTestInput('');
        setTestFeedback('none');
      } else {
        checkAnswer();
      }
    }
  };

  // --- Render Functions ---

  const renderHome = () => (
    <div className="w-full max-w-5xl mx-auto clay-card min-h-[90vh] my-8 relative flex flex-col overflow-hidden">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between px-6 md:px-10 py-6">
          <h1 className="text-[35px] font-bold text-[#272529] tracking-tight shrink-0 text-justify font-courier border-b-2 border-[#ceccdd] pb-1 flex items-center gap-3">
            <img src={APP_ICON_DATA_URI} alt="Logo" className="w-10 h-10 block" />
            <span>WordRunner</span>
          </h1>
          <button 
            onClick={() => setCurrentScreen('settings')}
            className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all clay-btn-white"
          >
            <Settings size={28} />
          </button>
        </div>

        {/* Second Row: Stats, Book Dropdown, Import */}
        <div className="flex flex-wrap items-center justify-between px-6 md:px-10 py-4 bg-linear-to-b from-gray-50 to-gray-100/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] border-t border-gray-200/60 gap-4">
          <div className="flex items-center gap-4 md:gap-8">
            {currentBook && (
              <div className="flex items-center gap-3 md:gap-6">
                <div className="flex flex-col items-center min-w-fit clay-badge px-4 py-1.5">
                  <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                  <span className="text-xl font-bold text-gray-700 leading-tight">{totalWords}</span>
                </div>
                <div className="flex flex-col items-center min-w-fit clay-badge px-4 py-1.5">
                  <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Learned</span>
                  <span className="text-xl font-bold text-emerald-600 leading-tight">{learnedWords}</span>
                </div>
                <div className="flex flex-col items-center min-w-fit clay-badge px-4 py-1.5">
                  <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Passed</span>
                  <span className="text-xl font-bold text-amber-600 leading-tight">{passedWords}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
            {books.length > 0 && (
              <div className="relative min-w-[140px] md:min-w-[240px] flex-1 max-w-xs" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between clay-btn-indigo px-4 py-2 text-xs md:text-sm font-bold active:scale-95 transition-all"
                >
                  <span className="truncate mr-2">
                    {books.find(b => b.id === currentBookId) ? getDisplayName(books.find(b => b.id === currentBookId)!.name) : 'Select Book'}
                  </span>
                  <motion.div
                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 5, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-0 w-full z-50 clay-card mt-2 py-2 overflow-hidden max-h-60 overflow-y-auto"
                    >
                      {books.map(book => (
                        <button
                          key={book.id}
                          onClick={() => {
                            setCurrentBookId(book.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-xs md:text-sm font-bold transition-colors hover:bg-indigo-50 ${
                            currentBookId === book.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'
                          }`}
                        >
                          {getDisplayName(book.name)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, .xlsx, .xls" className="hidden" />
            <button 
              onClick={handleImportClick} 
              className="flex items-center gap-2 clay-btn-indigo px-4 md:px-6 py-2 text-xs md:text-sm font-bold active:scale-95 shrink-0"
            >
              <Upload size={16} />
              <span>Import</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 md:px-10 py-6 md:py-10 flex flex-col md:flex-row gap-8 md:gap-12 overflow-y-auto">
        <section className="w-full md:w-1/2 flex flex-col">
          <div className="clay-card p-6 md:p-8 text-gray-800 flex-1 flex flex-col justify-center overflow-hidden relative">
            {/* Subtle background pattern for the cloud area */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {currentBook ? (
              <div className="flex flex-col flex-1 relative z-1">
                {/* Word Cloud Area */}
                <div className="flex-1 flex flex-wrap content-center justify-center items-center py-6 md:py-8 overflow-hidden">
                  {wordCloudWords.map((w, i) => {
                    // Use a simple hash to keep styles stable per word but pseudo-random
                    const hash = w.word.length + i * 7;
                    
                    const sizeClass = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'][hash % 6];
                    const colorClass = [
                      'text-indigo-600', 
                      'text-purple-600', 
                      'text-emerald-600', 
                      'text-amber-600', 
                      'text-rose-600', 
                      'text-cyan-600', 
                      'text-slate-600'
                    ][hash % 7];
                    const fontClass = ['font-sans', 'font-serif', 'font-mono'][hash % 3];
                    const weightClass = ['font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-black'][hash % 5];
                    const opacityClass = ['opacity-60', 'opacity-70', 'opacity-80', 'opacity-90', 'opacity-100'][hash % 5];
                    
                    // Rotation logic: 50% horizontal, 50% random between -15 and 15
                    const isHorizontal = hash % 2 === 0;
                    const rotations = [
                      'rotate-[-15deg]', 'rotate-[-12deg]', 'rotate-[-9deg]', 'rotate-[-6deg]', 'rotate-[-3deg]', 
                      'rotate-[3deg]', 'rotate-[6deg]', 'rotate-[9deg]', 'rotate-[12deg]', 'rotate-[15deg]'
                    ];
                    const orientationClass = isHorizontal ? 'rotate-0' : rotations[hash % rotations.length];

                    return (
                      <span 
                        key={w.id} 
                        className={`${sizeClass} ${colorClass} ${fontClass} ${weightClass} ${opacityClass} ${orientationClass} leading-none p-2 md:p-3 relative hover:z-10 transition-all hover:opacity-100 hover:scale-110 cursor-default inline-block`}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-lg">Please import a vocabulary book to start.</p>
              </div>
            )}
          </div>
        </section>

        <section className="w-full md:w-1/2 flex flex-col gap-8 md:gap-10 justify-center">
          <div>
            <h3 className="text-xs md:text-sm font-black text-gray-500 mb-4 uppercase tracking-widest">Words per session</h3>
            <div className="flex gap-3 md:gap-4">
              {batchOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => setBatchSize(size)}
                  className={`flex-1 py-3 md:py-4 text-base md:text-lg font-bold active:scale-95 ${
                    batchSize === size 
                      ? 'clay-btn-indigo scale-105' 
                      : 'clay-btn-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 md:gap-8">
            <button 
              onClick={startLearning}
              disabled={!currentBook || totalWords === 0}
              className="w-full flex items-center justify-center gap-3 clay-btn-emerald py-4 md:py-5 font-bold text-lg md:text-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen size={28} />
              <span>Learning Words</span>
            </button>

            <button 
              onClick={startTesting}
              disabled={!currentBook || totalWords === 0}
              className="w-full flex items-center justify-center gap-3 clay-btn-amber py-4 md:py-5 font-bold text-lg md:text-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={28} />
              <span>Testing Words</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );

  const renderLearning = () => {
    const currentWord = sessionWords[currentIndex];
    if (!currentWord) return null;

    return (
      <div className="w-full max-w-2xl mx-auto clay-card min-h-[90vh] my-8 relative flex flex-col overflow-hidden">
        <header className="flex items-center px-6 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md">
          <button onClick={() => { window.speechSynthesis.cancel(); setCurrentScreen('home'); }} className="p-3 text-gray-500 clay-btn-white">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 text-center font-bold text-gray-500 text-lg">
            Learning: {currentIndex + 1} / {sessionWords.length}
          </div>
          <div className="w-12"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-full max-w-md flex flex-col items-center text-center space-y-10">
            <div className="clay-card p-12 w-full">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">{currentWord.word}</h2>
              <div className="flex items-center justify-center gap-3 text-gray-500 text-2xl">
                <span className="font-medium">{currentWord.phonetic}</span>
                <button 
                  onClick={() => speakWord(currentWord.word)}
                  className="p-3 clay-btn-white text-indigo-500"
                  title="Listen to pronunciation"
                >
                  <Volume2 size={28} />
                </button>
              </div>
            </div>

            <div className="w-full space-y-8 text-left">
              <div className="clay-card p-8">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Meaning</h4>
                <p className="text-3xl font-bold text-gray-800">{currentWord.meaning}</p>
              </div>
              
              {currentWord.sentence && (
                <div className="clay-card p-8">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Example
                    <button 
                      onClick={() => speakWord(currentWord.sentence)}
                      className="p-2 clay-btn-white text-gray-400 hover:text-indigo-500"
                      title="Listen to sentence"
                    >
                      <Volume2 size={18} />
                    </button>
                  </h4>
                  <p className="text-xl text-gray-600 italic font-medium">"{currentWord.sentence}"</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-6">
          <button 
            onClick={nextWord}
            className="flex-1 py-5 clay-btn-white font-bold text-xl active:scale-95"
          >
            Skip
          </button>
          <button 
            onClick={markAsLearned}
            className="flex-[2] flex items-center justify-center gap-3 py-5 clay-btn-emerald font-bold text-xl active:scale-95"
          >
            <Check size={28} />
            <span>Got it!</span>
          </button>
        </footer>
      </div>
    );
  };

  const renderTesting = () => {
    const currentWord = sessionWords[currentIndex];
    if (!currentWord) return null;

    return (
      <div className="w-full max-w-2xl mx-auto clay-card min-h-[90vh] my-8 relative flex flex-col overflow-hidden">
        <header className="flex items-center px-6 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md">
          <button onClick={() => { window.speechSynthesis.cancel(); setCurrentScreen('home'); }} className="p-3 text-gray-500 clay-btn-white">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 text-center font-bold text-gray-500 text-lg">
            Testing: {currentIndex + 1} / {sessionWords.length}
          </div>
          <div className="w-12"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-full max-w-md flex flex-col items-center text-center space-y-12">
            
            {/* Prompt Area */}
            <div className="space-y-6 w-full">
              <div className="flex justify-center gap-6 text-xs font-black uppercase tracking-widest text-gray-400">
                <span className="flex items-center gap-2 clay-card px-4 py-2">
                  <Check size={16} className="text-emerald-500" />
                  Success: {currentWord.testSuccessCount || 0}
                </span>
                <span className="flex items-center gap-2 clay-card px-4 py-2">
                  <X size={16} className="text-red-500" />
                  Failure: {currentWord.testFailureCount || 0}
                </span>
              </div>
              <div className="clay-card p-10">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800">{currentWord.meaning}</h2>
              </div>
              
              {showHint && (
                <div className="flex items-center justify-center gap-3 text-indigo-500 text-2xl font-bold clay-card py-4 px-8 inline-flex">
                  <span>{currentWord.phonetic}</span>
                  <button 
                    onClick={() => speakWord(currentWord.word)}
                    className="p-2 clay-btn-white"
                  >
                    <Volume2 size={24} />
                  </button>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="w-full relative">
              <input
                ref={inputRef}
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type the English word..."
                className={`w-full text-center text-4xl font-bold p-8 clay-card outline-none transition-all ${
                  testFeedback === 'none' ? 'text-gray-900' :
                  testFeedback === 'correct' ? 'text-emerald-600 bg-emerald-50' :
                  'text-red-600 bg-red-50'
                }`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                disabled={testFeedback === 'correct'}
              />
              
              {/* Feedback Icons */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                {testFeedback === 'correct' && <CheckCircle2 className="text-emerald-500" size={48} />}
                {testFeedback === 'incorrect' && <X className="text-red-500" size={48} />}
              </div>
            </div>

            {/* Incorrect Feedback Message */}
            {testFeedback === 'incorrect' && (
              <div className="text-red-500 font-bold text-xl animate-bounce">
                Incorrect. Try again or skip.
              </div>
            )}
          </div>
        </main>

        <footer className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-6">
          <button 
            onClick={skipTestWord}
            className="flex-1 py-5 clay-btn-white font-bold text-xl active:scale-95"
          >
            Skip
          </button>
          <button 
            onClick={testFeedback === 'incorrect' ? () => { setTestInput(''); setTestFeedback('none'); inputRef.current?.focus(); } : checkAnswer}
            disabled={!testInput.trim() || testFeedback === 'correct'}
            className={`flex-[2] py-5 font-bold text-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              testFeedback === 'incorrect' 
                ? 'clay-btn-indigo' 
                : 'clay-btn-amber'
            }`}
          >
            {testFeedback === 'incorrect' ? 'Try Again' : 'Check'}
          </button>
        </footer>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="w-full max-w-2xl mx-auto clay-card min-h-[90vh] my-8 relative flex flex-col overflow-hidden">
      <header className="flex items-center px-6 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <button onClick={() => setCurrentScreen('home')} className="p-3 text-gray-500 clay-btn-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-2xl font-bold text-gray-800 ml-4 flex items-center gap-2">
          <img src={APP_ICON_DATA_URI} alt="Logo" className="w-8 h-8 block" />
          <span>设置</span>
        </h1>
      </header>

      <main className="flex-1 p-10 space-y-10">
        <div className="clay-card p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-8">测试偏好</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-800">测试时始终显示音标</p>
              <p className="text-sm text-gray-500 mt-1">如果禁用，音标仅在答错后显示。</p>
            </div>
            
            {/* Toggle Switch */}
            <button 
              onClick={() => setSettings(s => ({ ...s, showPhoneticInTest: !s.showPhoneticInTest }))}
              className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all clay-card ${
                settings.showPhoneticInTest ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            >
              <span 
                className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform ${
                  settings.showPhoneticInTest ? 'translate-x-11' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="clay-card p-8 bg-red-50/50 border-red-100">
          <h3 className="text-xl font-bold text-red-800 mb-4">危险区域</h3>
          <p className="text-sm text-red-600 mb-8 font-medium">
            重置应用将删除所有导入的单词本和学习进度。此操作无法撤销。
          </p>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-4 clay-btn-red text-lg font-bold"
          >
            重置应用数据
          </button>
        </div>

        <div className="clay-card p-8 bg-blue-50/50 border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-blue-800">从服务器同步已有数据</h3>
          </div>
          <p className="text-sm text-blue-600 mb-6 font-medium">
            输入别的服务器 IP 地址，点击“下载数据”按钮从该服务器同步所有单词本。
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              placeholder="输入服务器 IP (例如: 192.168.1.100)"
              className="flex-1 px-6 py-4 clay-card outline-none focus:ring-2 focus:ring-blue-400 text-lg"
            />
            <button
              onClick={handleSyncFromServer}
              disabled={isSyncing}
              className="px-8 py-4 clay-btn-indigo text-lg font-bold disabled:opacity-50"
            >
              {isSyncing ? '同步中...' : '下载数据'}
            </button>
          </div>
        </div>
      </main>

    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900 font-sans py-8 px-4">
      {currentScreen === 'home' && renderHome()}
      {currentScreen === 'learning' && renderLearning()}
      {currentScreen === 'testing' && renderTesting()}
      {currentScreen === 'settings' && renderSettings()}

      {/* Global Modals */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="clay-card p-10 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.05),inset_4px_4px_8px_rgba(255,255,255,0.8)]">
              <Upload className="text-amber-600" size={36} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">覆盖已有单词表？</h3>
            <p className="text-gray-500 text-center mb-10 font-medium leading-relaxed">
              已经存在名为 "{pendingBook ? getDisplayName(pendingBook.name) : ''}" 的单词表。是否覆盖它？
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={confirmOverwrite}
                className="w-full py-5 clay-btn-amber text-xl font-bold active:scale-95"
              >
                确定覆盖
              </button>
              <button
                onClick={cancelOverwrite}
                className="w-full py-5 clay-btn-white text-xl font-bold active:scale-95"
              >
                放弃
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="clay-card p-10 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.05),inset_4px_4px_8px_rgba(255,255,255,0.8)]">
              <Trash2 className="text-red-600" size={36} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">确定要重置吗？</h3>
            <p className="text-gray-500 text-center mb-10 font-medium leading-relaxed">
              这将删除所有导入的单词本、学习进度和设置。此操作不可撤销。
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full py-5 clay-btn-red text-xl font-bold active:scale-95 disabled:opacity-50"
              >
                {isResetting ? '正在重置...' : '确定重置'}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="w-full py-5 clay-btn-white text-xl font-bold active:scale-95"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
