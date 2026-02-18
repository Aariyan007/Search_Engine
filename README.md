# Search Engine: Node.js Backend Implementation

A complete search engine built from scratch in Node.js, implementing web crawling, full-text indexing, and intelligent ranking using BM25 (relevance) and PageRank (authority).

## Installation & Quick Start

```bash
npm install
```

Configure seed URLs in `seeds/seeds.json`:
```json
[
  {"domain": "example.com", "maxPages": 100},
  {"domain": "example.org", "maxPages": 50}
]
```

Run the pipeline:
```bash
node crawler/crawler.js          # Crawl and store HTML
node processor/processor.js      # Extract text from HTML
node processor/tokenizer.js      # Tokenize and normalize
node index/indexer.js            # Build inverted index
node rank/pagerank.js            # Compute authority scores
node search/search.js "query"    # Search
```

Example:
```bash
$ node search/search.js "machine learning"

Search results:

1. Machine Learning Fundamentals
   https://example.com/ml-101
2. Deep Learning Explained
   https://example.com/algorithms
```

---

## Project Structure

```
search-engine/
├── crawler/
│   └── crawler.js              # Web crawling with axios + cheerio
├── processor/
│   ├── processor.js            # HTML parsing, text extraction
│   └── tokenizer.js            # Tokenization, stopword removal
├── index/
│   └── indexer.js              # Inverted index construction
├── rank/
│   ├── bm25.js                 # BM25 relevance scoring
│   └── pagerank.js             # PageRank authority computation
├── search/
│   └── search.js               # Query interface, result ranking
├── seeds/
│   └── seeds.json              # Seed URLs and configuration
└── data/                        # Generated at runtime
    ├── rawPages.json
    ├── documents.json
    ├── invertedIndex.json
    └── pageRank.json
```

---

## How It Works: Complete Pipeline

### Phase 1: Web Crawling (`crawler/crawler.js`)

The crawler fetches HTML documents from seed domains and extracts links between pages.

**Logic:**
```
for each seed domain:
  Initialize queue with seed URL
  while queue has URLs and visited < maxPages:
    1. Pop URL from queue
    2. Check if already visited (prevent infinite loops)
    3. Fetch HTML using axios
    4. Parse HTML using cheerio
    5. Extract all <a> tags that point to same domain
    6. Store {url, html, links} in memory
    7. Add new links to queue
  
  After crawling complete:
    Write all pages to data/rawPages.json
```

**Example with 2 pages:**
```
Seed: https://example.com

Queue: [https://example.com]
Visited: {}

Step 1: Fetch https://example.com
  - Found links: [https://example.com/page1, https://example.com/page2]
  - Store: {url: "https://example.com", html: "<html>...", link: [...]}
  - Add to queue: [https://example.com/page1, https://example.com/page2]
  - Visited: {https://example.com}

Step 2: Fetch https://example.com/page1
  - Found links: [https://example.com/page2]
  - Store: {url: "https://example.com/page1", html: "...", link: [...]}
  - Page2 already in queue, don't add again
  - Visited: {https://example.com, https://example.com/page1}

Step 3: Fetch https://example.com/page2
  - Found links: [https://example.com/page1]
  - Page1 already visited, don't add
  - Visited: {https://example.com, https://example.com/page1, https://example.com/page2}

Queue is empty, crawling complete.
```

**Output (`data/rawPages.json`):**
```json
[
  {
    "url": "https://example.com",
    "html": "<html><head><title>Home</title></head><body>Welcome</body></html>",
    "link": ["https://example.com/page1", "https://example.com/page2"]
  },
  {
    "url": "https://example.com/page1",
    "html": "<html>...",
    "link": ["https://example.com/page2"]
  }
]
```

---

### Phase 2: Text Extraction (`processor/processor.js`)

The processor reads raw HTML and extracts visible text content, title, and page URL.

**Logic:**
```
for each raw HTML page:
  1. Load HTML into cheerio (jQuery-like parser)
  2. Remove non-content elements (script, style, nav, footer, header)
  3. Extract title from <title> tag
  4. Extract text from all <p> tags
  5. Create document object with:
     - Unique docId (doc_1, doc_2, ...)
     - URL
     - Title
     - Raw text
  6. Store in documents array

Write all documents to data/documents.json
```

**Example:**

Input HTML:
```html
<html>
  <head>
    <title>Machine Learning Guide</title>
    <script>// ignore this</script>
  </head>
  <body>
    <nav>Navigation menu</nav>
    <p>Machine learning is a subset of artificial intelligence.</p>
    <p>It focuses on learning from data.</p>
    <footer>Copyright 2024</footer>
  </body>
</html>
```

After extraction (removed script, nav, footer):
```
Title: "Machine Learning Guide"
Text: "Machine learning is a subset of artificial intelligence. It focuses on learning from data."
```

**Output (`data/documents.json`):**
```json
[
  {
    "docId": "doc_1",
    "url": "https://example.com",
    "title": "Machine Learning Guide",
    "rawText": "Machine learning is a subset of artificial intelligence. It focuses on learning from data."
  }
]
```

---

### Phase 3: Tokenization & Normalization (`processor/tokenizer.js`)

Tokenization converts text into words, normalizes them, and removes common stopwords.

**Logic:**
```
stopwords = {the, is, a, an, to, of, in, on, and, or, for, with, at, by, ...}

for each document:
  1. Lowercase all text
  2. Remove non-alphabetic characters: /[^a-z\s]/g
  3. Split on whitespace to get words
  4. Keep only words with length > 1
  5. Remove stopwords from the list
  6. Store resulting tokens and count them as document length

Write updated documents to data/documents.json
```

**Example:**

Input:
```
"Machine learning is a subset of artificial intelligence."
```

Step by step:
```
1. Lowercase:
   "machine learning is a subset of artificial intelligence."

2. Remove non-alphabetic (/[^a-z\s]/g):
   "machine learning is a subset of artificial intelligence"

3. Split on whitespace:
   ["machine", "learning", "is", "a", "subset", "of", "artificial", "intelligence"]

4. Filter length > 1:
   ["machine", "learning", "is", "subset", "of", "artificial", "intelligence"]

5. Remove stopwords (is, a, of):
   ["machine", "learning", "subset", "artificial", "intelligence"]
```

**Output (`data/documents.json` updated):**
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

**Why remove stopwords?**
- Words like "the", "is", "a" appear in almost every document
- They don't help distinguish one document from another
- Removing them reduces index size by ~30% and speeds up search
- Documents about "cats" and "dogs" both have "the" but it doesn't help find which is about what

---

### Phase 4: Building the Inverted Index (`index/indexer.js`)

An inverted index maps each word to the documents where it appears.

**Logic:**
```
for each document:
  for each token in document.tokens:
    increment the frequency count of (token, docId)

Store as: {word: {docId: frequency, ...}, ...}
```

**Example:**

Documents:
```
doc_1 tokens: ["machine", "learning", "subset", "artificial", "intelligence"]
doc_2 tokens: ["learning", "algorithms", "neural", "networks"]
doc_3 tokens: ["machine", "learning", "deep", "learning"]
```

Building index:
```
Token "machine":
  doc_1: appears 1 time
  doc_3: appears 1 time
  → {machine: {doc_1: 1, doc_3: 1}}

Token "learning":
  doc_1: appears 1 time
  doc_2: appears 1 time
  doc_3: appears 2 times
  → {learning: {doc_1: 1, doc_2: 1, doc_3: 2}}

Token "algorithms":
  doc_2: appears 1 time
  → {algorithms: {doc_2: 1}}
```

**Output (`data/invertedIndex.json`):**
```json
{
  "machine": {
    "doc_1": 1,
    "doc_3": 1
  },
  "learning": {
    "doc_1": 1,
    "doc_2": 1,
    "doc_3": 2
  },
  "subset": {
    "doc_1": 1
  },
  "artificial": {
    "doc_1": 1
  },
  "intelligence": {
    "doc_1": 1
  },
  "algorithms": {
    "doc_2": 1
  },
  "neural": {
    "doc_2": 1
  },
  "networks": {
    "doc_2": 1
  },
  "deep": {
    "doc_3": 1
  }
}
```

**How it's used for search:**
- User searches for "learning"
- Lookup "learning" in index → {doc_1: 1, doc_2: 1, doc_3: 2}
- Know immediately that docs 1, 2, and 3 contain "learning"
- Don't need to read all documents to find matches

---

### Phase 5: PageRank Authority Scoring (`rank/pagerank.js`)

PageRank computes how "important" each page is based on the link structure of the website.

**Core Idea:**
- A page is important if many other pages link to it
- Links from important pages count more than links from unimportant pages

**Algorithm:**

Initialize all pages with equal rank:
```
PR(page) = 1 / total_number_of_pages
```

For each iteration (repeat 10 times):
```
For each page:
  1. Calculate teleportation rank: (1 - damping) / N
     where damping = 0.85, N = total pages
  
  2. For each page that links TO this page:
     - Get the link source's current rank
     - Divide by number of outgoing links from source
     - Multiply by damping factor (0.85)
     - Add to this page's new rank
  
  3. Update rank with new value
```

**Example with 3 pages:**

Link structure:
```
A → B
A → C
B → C
C → A
```

Page A: has 2 outgoing links (to B and C)
Page B: has 1 outgoing link (to C)
Page C: has 1 outgoing link (to A)

**Iteration 0 - Initialize:**
```
PR(A) = 1/3 = 0.333
PR(B) = 1/3 = 0.333
PR(C) = 1/3 = 0.333
```

**Iteration 1:**
```
newPR(A) = (1 - 0.85) / 3 = 0.05
           + 0.85 * PR(C) / 1 = 0.05 + 0.85 * 0.333 = 0.334

newPR(B) = 0.05 + 0.85 * PR(A) / 2 = 0.05 + 0.85 * 0.333 / 2 = 0.191

newPR(C) = 0.05 + 0.85 * (PR(A) / 2 + PR(B) / 1)
         = 0.05 + 0.85 * (0.333 / 2 + 0.333)
         = 0.05 + 0.85 * 0.5165 = 0.489
```

**Iteration 2:**
```
newPR(A) = 0.05 + 0.85 * 0.489 = 0.466
newPR(B) = 0.05 + 0.85 * 0.334 / 2 = 0.192
newPR(C) = 0.05 + 0.85 * (0.466 / 2 + 0.192) = 0.341
```

After 10 iterations, ranks stabilize. Page C ends up with highest rank (most important) because:
- A links to C
- B links to C
- C receives 2 inbound links

**Output (`data/pageRank.json`):**
```json
[
  {
    "docId": "doc_1",
    "url": "https://example.com/pageA",
    "score": 0.466
  },
  {
    "docId": "doc_2",
    "url": "https://example.com/pageB",
    "score": 0.192
  },
  {
    "docId": "doc_3",
    "url": "https://example.com/pageC",
    "score": 0.341
  }
]
```

---

## Query-Time Processing

### Step 1: Query Tokenization (`search/search.js`)

When a user searches, apply the same tokenization pipeline as indexing:

**Input:** `"machine learning algorithms"`

**Process:**
```
1. Lowercase: "machine learning algorithms"
2. Remove non-alphabetic: "machine learning algorithms"
3. Split: ["machine", "learning", "algorithms"]
4. Filter stopwords: ["machine", "learning", "algorithms"] (none removed)
5. Output: ["machine", "learning", "algorithms"]
```

---

### Step 2: Index Lookup & BM25 Scoring (`rank/bm25.js`)

For each query token, look up the inverted index and calculate a relevance score using BM25 formula.

**BM25 Formula:**
```
score(document, query) = Σ IDF(term) × (TF(term, doc) × (k1 + 1)) / (TF(term, doc) + k1 × (1 - b + b × doc_length / avg_length))

where:
  IDF(term) = log(1 + (N - df(term) + 0.5) / (df(term) + 0.5))
  
  TF(term, doc) = how many times term appears in document
  
  df(term) = how many documents contain the term
  
  N = total documents
  
  doc_length = token count in this document
  
  avg_length = average token count across all documents
  
  k1 = 1.5 (saturation parameter - controls how much repeated words help)
  
  b = 0.75 (length normalization - controls document length bias)
```

**Conceptual Explanation:**

1. **IDF (Inverse Document Frequency):**
   - If term appears in 1 out of 100 documents: IDF is high (rare term, important)
   - If term appears in 50 out of 100 documents: IDF is low (common term, less important)

2. **TF Saturation (k1 = 1.5):**
   - A term appearing 1 time helps score
   - A term appearing 2 times helps more (but not double)
   - A term appearing 10 times helps only slightly more than appearing 5 times
   - Prevents "keyword stuffing" from dominating results

3. **Length Normalization (b = 0.75):**
   - A 5000-word document with "machine" once shouldn't rank higher than a 500-word document with "machine" once
   - Longer documents naturally have more words and higher term frequencies
   - This parameter compensates for that

**Example Calculation:**

Query: `["machine", "learning"]`

Total documents: 100
Average document length: 500 tokens

Document 1 info:
- Tokens: ["machine", "learning", "subset", "artificial", "intelligence"]
- Length: 5
- TF("machine") = 1
- TF("learning") = 1

Inverted index:
- "machine": appears in 10 documents
- "learning": appears in 25 documents

**Step 1: Calculate IDF**
```
IDF("machine") = log(1 + (100 - 10 + 0.5) / (10 + 0.5))
               = log(1 + 90.5 / 10.5)
               = log(1 + 8.62)
               = log(9.62)
               = 2.26

IDF("learning") = log(1 + (100 - 25 + 0.5) / (25 + 0.5))
                = log(1 + 75.5 / 25.5)
                = log(1 + 2.96)
                = log(3.96)
                = 1.38
```

**Step 2: Calculate BM25 for "machine"**
```
k1 = 1.5, b = 0.75

numerator = TF × (k1 + 1) = 1 × 2.5 = 2.5

denominator = TF + k1 × (1 - b + b × doc_length / avg_length)
            = 1 + 1.5 × (1 - 0.75 + 0.75 × 5 / 500)
            = 1 + 1.5 × (0.25 + 0.0075)
            = 1 + 1.5 × 0.2575
            = 1 + 0.386
            = 1.386

BM25("machine") = IDF × numerator / denominator
                = 2.26 × 2.5 / 1.386
                = 4.07
```

**Step 3: Calculate BM25 for "learning"**
```
numerator = 1 × 2.5 = 2.5

denominator = 1 + 1.5 × (0.25 + 0.0075) = 1.386

BM25("learning") = 1.38 × 2.5 / 1.386
                 = 2.49
```

**Step 4: Total score for document 1**
```
score(doc_1) = BM25("machine") + BM25("learning")
             = 4.07 + 2.49
             = 6.56
```

**Output:** `{doc_1: 6.56, doc_2: 3.21, doc_3: 8.93, ...}`

---

### Step 3: Combine with PageRank (`search/search.js`)

Fuse BM25 scores with PageRank authority scores for final ranking.

**Logic:**
```
for each document in BM25 results:
  bm25_score = from BM25 calculation
  pagerank_score = from data/pageRank.json
  
  final_score = (bm25_score × 0.7) + (pagerank_score × 0.3)
  
  Save final_score for sorting
```

**Example:**

Document 1:
- BM25 score: 6.56
- PageRank score: 0.012
- Final: (6.56 × 0.7) + (0.012 × 0.3) = 4.592 + 0.0036 = 4.595

Document 2:
- BM25 score: 3.21
- PageRank score: 0.025
- Final: (3.21 × 0.7) + (0.025 × 0.3) = 2.247 + 0.0075 = 2.255

Document 3:
- BM25 score: 8.93
- PageRank score: 0.008
- Final: (8.93 × 0.7) + (0.008 × 0.3) = 6.251 + 0.0024 = 6.253

**Sorting by final score (descending):**
```
Rank 1: Document 3 (6.253)
Rank 2: Document 1 (4.595)
Rank 3: Document 2 (2.255)
```

---

## Complete Example: Query "machine learning"

**Documents in system:**
```
doc_1: "Machine learning is a subset of artificial intelligence."
doc_2: "Learning algorithms for neural networks."
doc_3: "Deep learning and machine learning techniques."
```

**After tokenization:**
```
doc_1 tokens: [machine, learning, subset, artificial, intelligence]
doc_2 tokens: [learning, algorithms, neural, networks]
doc_3 tokens: [deep, learning, machine, learning]
```

**Inverted index:**
```
machine: {doc_1: 1, doc_3: 1}
learning: {doc_1: 1, doc_2: 1, doc_3: 2}
subset: {doc_1: 1}
artificial: {doc_1: 1}
intelligence: {doc_1: 1}
algorithms: {doc_2: 1}
neural: {doc_2: 1}
networks: {doc_2: 1}
deep: {doc_3: 1}
```

**PageRank scores:**
```
doc_1: 0.012
doc_2: 0.005
doc_3: 0.020
```

**Query: "machine learning"**

1. Tokenize query → ["machine", "learning"]

2. BM25 scoring:
   - doc_1: matches both terms, 1 each
   - doc_2: matches "learning" only
   - doc_3: matches both terms, "learning" appears 2x

3. BM25 results:
   - doc_1: 5.2 (high relevance)
   - doc_2: 2.8 (lower relevance)
   - doc_3: 7.5 (highest relevance)

4. Apply PageRank:
   - doc_1: (5.2 × 0.7) + (0.012 × 0.3) = 3.644 + 0.0036 = 3.648
   - doc_2: (2.8 × 0.7) + (0.005 × 0.3) = 1.960 + 0.0015 = 1.962
   - doc_3: (7.5 × 0.7) + (0.020 × 0.3) = 5.250 + 0.0060 = 5.256

5. Final ranking:
   ```
   1. doc_3 (score: 5.256)
      "Deep learning and machine learning techniques."
   
   2. doc_1 (score: 3.648)
      "Machine learning is a subset of artificial intelligence."
   
   3. doc_2 (score: 1.962)
      "Learning algorithms for neural networks."
   ```

---

## Configuration

### Crawl Seeds (`seeds/seeds.json`)
```json
[
  {
    "domain": "example.com",
    "maxPages": 500
  }
]
```

### BM25 Parameters (`rank/bm25.js`)
```javascript
const k1 = 1.5;    // Term frequency saturation
const b = 0.75;    // Length normalization
```

- `k1`: Higher = repeated words help more; Lower = diminishing returns kick in sooner
- `b`: Closer to 1 = length matters less; Closer to 0 = longer docs ranked higher

### PageRank Parameters (`rank/pagerank.js`)
```javascript
const damping = 0.85;      // Probability of following links
const iterations = 10;     // Number of calculations
```

- `damping`: Standard value is 0.85 (15% chance of "teleporting" to random page)
- `iterations`: More iterations = more accurate; typically 10-30 is sufficient

### Score Fusion Weights (`search/search.js`)
```javascript
const bm25Weight = 0.7;    // Relevance weight
const prWeight = 0.3;      // Authority weight
```

- Adjust based on corpus: increase BM25 for keyword-focused search, increase PageRank for authority-focused ranking

---

## Data Storage

### data/rawPages.json
Raw HTML pages with link structure from crawling.
```json
[
  {
    "url": "https://example.com",
    "html": "<html>...</html>",
    "link": ["https://example.com/page1", "https://example.com/page2"]
  }
]
```

### data/documents.json
Processed documents with extracted text and tokens.
```json
[
  {
    "docId": "doc_1",
    "url": "https://example.com",
    "title": "Example Page",
    "tokens": ["word1", "word2", "word3"],
    "length": 3
  }
]
```

### data/invertedIndex.json
Inverted index mapping terms to documents and frequencies.
```json
{
  "word1": {
    "doc_1": 5,
    "doc_3": 2
  },
  "word2": {
    "doc_1": 3,
    "doc_2": 1
  }
}
```

### data/pageRank.json
Authority scores for each document.
```json
[
  {
    "docId": "doc_1",
    "url": "https://example.com",
    "score": 0.012
  }
]
```

---

## Tools & Dependencies

- **axios**: HTTP client for fetching web pages
- **cheerio**: Fast jQuery-like HTML parsing
- **Node.js fs**: File system operations for storage
- **Node.js path**: Directory path handling

---

## License

MIT
