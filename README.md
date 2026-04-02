# Search Engine: Node.js Backend Implementation

A complete search engine built from scratch in Node.js, implementing web crawling, full-text indexing, and intelligent ranking using BM25 (relevance) and PageRank (authority).

## Requirements

- Node.js v18 or higher
- npm comes with Node.js automatically

Check if installed:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org

## Installation and Quick Start

Clone the project:
```bash
git clone https://github.com/Aariyan007/Search_Engine.git
cd Search_Engine
```

Install dependencies and auto setup:
```bash
npm install
```

This will automatically create the data/ and seeds/ folders and a default seeds.json file.

Configure seed URLs in seeds/seeds.json:
```json
[
  {"domain": "books.toscrape.com", "maxPages": 10}
]
```

Run the full pipeline:
```bash
npm start
```

Search:
```bash
npm run search "your query here"
```

Example:
```bash
npm run search "fiction"
npm run search "mystery"
npm run search "history"
```

---

## Project Structure
```
search-engine/
├── crawler/
│   └── crawler.js              # Web crawling with axios + cheerio
├── processor/
│   ├── extractText.js          # HTML parsing, text extraction
│   └── tokenize.js             # Tokenization, stopword removal
├── index/
│   └── buildIndex.js           # Inverted index construction
├── rank/
│   ├── bm25.js                 # BM25 relevance scoring
│   └── pagerank.js             # PageRank authority computation
├── search/
│   └── search.js               # Query interface, result ranking
├── seeds/
│   └── seeds.json              # Seed URLs and configuration (auto created)
├── setup.js                    # Auto setup script
└── data/                       # Generated at runtime
    ├── rawPages.json
    ├── documents.json
    ├── invertedIndex.json
    └── pageRank.json
```

---

## How It Works: Complete Pipeline

### Phase 1: Web Crawling (crawler/crawler.js)

The crawler fetches HTML documents from seed domains and extracts links between pages.

Logic:
```
for each seed domain:
  Initialize queue with seed URL
  while queue has URLs and visited < maxPages:
    1. Pop URL from queue
    2. Check if already visited (prevent infinite loops)
    3. Fetch HTML using axios
    4. Parse HTML using cheerio
    5. Extract all a tags that point to same domain
    6. Store {url, html, links} in memory
    7. Add new links to queue
  
  After crawling complete:
    Write all pages to data/rawPages.json
```

Output (data/rawPages.json):
```json
[
  {
    "url": "https://example.com",
    "html": "<html><head><title>Home</title></head><body>Welcome</body></html>",
    "link": ["https://example.com/page1", "https://example.com/page2"]
  }
]
```

---

### Phase 2: Text Extraction (processor/extractText.js)

The processor reads raw HTML and extracts visible text content, title, and page URL.

Logic:
```
for each raw HTML page:
  1. Load HTML into cheerio
  2. Remove non-content elements (script, style, nav, footer, header)
  3. Extract title from title tag
  4. Extract text from p, h1, h2, h3, h4, article, li tags
  5. Create document object with docId, URL, title, raw text
  6. Store in documents array

Write all documents to data/documents.json
```

Output (data/documents.json):
```json
[
  {
    "docId": "doc_1",
    "url": "https://example.com",
    "title": "Machine Learning Guide",
    "rawText": "Machine learning is a subset of artificial intelligence."
  }
]
```

---

### Phase 3: Tokenization and Normalization (processor/tokenize.js)

Tokenization converts text into words, normalizes them, and removes common stopwords.

Logic:
```
stopwords = {the, is, a, an, to, of, in, on, and, or, for, with, at, by}

for each document:
  1. Lowercase all text
  2. Remove non-alphabetic characters
  3. Split on whitespace to get words
  4. Keep only words with length > 1
  5. Remove stopwords
  6. Store resulting tokens and count them as document length
```

Output (data/documents.json updated):
```json
[
  {
    "docId": "doc_1",
    "url": "https://example.com",
    "title": "Machine Learning Guide",
    "tokens": ["machine", "learning", "subset", "artificial", "intelligence"],
    "length": 5
  }
]
```

---

### Phase 4: Building the Inverted Index (index/buildIndex.js)

An inverted index maps each word to the documents where it appears.

Output (data/invertedIndex.json):
```json
{
  "machine": {"doc_1": 1, "doc_3": 1},
  "learning": {"doc_1": 1, "doc_2": 1, "doc_3": 2}
}
```

---

### Phase 5: PageRank Authority Scoring (rank/pagerank.js)

PageRank computes how important each page is based on the link structure of the website.

Output (data/pageRank.json):
```json
[
  {"docId": "doc_1", "url": "https://example.com", "score": 0.466}
]
```

---

### Phase 6: Search (search/search.js)

Combines BM25 relevance scores with PageRank authority scores for final ranking.
```
final_score = (bm25_score x 0.7) + (pagerank_score x 0.3)
```

---

## Configuration

### Crawl Seeds (seeds/seeds.json)
```json
[
  {
    "domain": "books.toscrape.com",
    "maxPages": 10
  }
]
```

### BM25 Parameters (rank/bm25.js)
```javascript
const k1 = 1.5;
const b = 0.75;
```

### PageRank Parameters (rank/pagerank.js)
```javascript
const damping = 0.85;
const iterations = 10;
```

### Score Fusion Weights (search/search.js)
```javascript
const bm25Weight = 0.7;
const prWeight = 0.3;
```

---

## Tools and Dependencies

- axios: HTTP client for fetching web pages
- cheerio: Fast jQuery-like HTML parsing
- Node.js fs: File system operations for storage
- Node.js path: Directory path handling

---

## License

MIT