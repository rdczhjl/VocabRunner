import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import http from 'http';
import https from 'https';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const HTTPS_PORT = 3443;
const BOOKS_DIR = path.join(process.cwd(), 'books');

// SSL Certificate paths (for local LAN deployment)
const SSL_KEY_PATH = path.join(process.cwd(), 'key.pem');
const SSL_CERT_PATH = path.join(process.cwd(), 'cert.pem');

// Ensure books directory exists
if (!fs.existsSync(BOOKS_DIR)) {
  fs.mkdirSync(BOOKS_DIR, { recursive: true });
}

app.use(cors());
// Allow large JSON payloads for big vocabulary books
app.use(express.json({ limit: '50mb' }));

// API Routes
app.get('/api/books', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (!fs.existsSync(BOOKS_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.json'));
    const books = files.map(file => {
      try {
        const content = fs.readFileSync(path.join(BOOKS_DIR, file), 'utf-8');
        return JSON.parse(content);
      } catch (e) {
        console.error(`Error parsing book file ${file}:`, e);
        return null;
      }
    }).filter(Boolean);
    res.json(books);
  } catch (error) {
    console.error('Error reading books:', error);
    res.status(500).json({ error: 'Failed to read books' });
  }
});

app.post('/api/books', (req, res) => {
  try {
    const book = req.body;
    if (!book || !book.id) {
      return res.status(400).json({ error: 'Invalid book data' });
    }
    if (!fs.existsSync(BOOKS_DIR)) {
      fs.mkdirSync(BOOKS_DIR, { recursive: true });
    }
    const filePath = path.join(BOOKS_DIR, `${book.id}.json`);
    console.log(`Saving book: ${book.name} (${book.id}) to ${filePath}`);
    fs.writeFileSync(filePath, JSON.stringify(book, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving book:', error);
    res.status(500).json({ error: 'Failed to save book' });
  }
});

app.delete('/api/books', (req, res) => {
  try {
    console.log('Received request to delete all books...');
    if (fs.existsSync(BOOKS_DIR)) {
      const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.json'));
      console.log(`Found ${files.length} book files to delete in ${BOOKS_DIR}`);
      for (const file of files) {
        const filePath = path.join(BOOKS_DIR, file);
        console.log(`Deleting file: ${filePath}`);
        fs.unlinkSync(filePath);
      }
      // Double check
      const remainingFiles = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.json'));
      if (remainingFiles.length > 0) {
        console.warn(`Warning: ${remainingFiles.length} files still remain after deletion attempt.`);
      }
    } else {
      console.log('Books directory does not exist, nothing to delete.');
    }
    res.json({ success: true, message: 'All books deleted' });
  } catch (error) {
    console.error('Error deleting books:', error);
    res.status(500).json({ error: 'Failed to delete books' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          ignored: ['**/books/**']
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    // Catch-all route to serve index.html for SPA routing in production
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  // Create HTTP server
  const httpServer = http.createServer(app);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP Server running on http://0.0.0.0:${PORT}`);
  });

  // Create HTTPS server if certificates exist
  if (fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
    try {
      const httpsOptions = {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH),
      };
      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`HTTPS Server running on https://0.0.0.0:${HTTPS_PORT}`);
      });
    } catch (err) {
      console.error('Failed to start HTTPS server:', err);
    }
  } else {
    console.log('SSL certificates not found. HTTPS server will not start.');
    console.log('To enable HTTPS, place key.pem and cert.pem in the root directory.');
  }
}

startServer();
