
# 🔍 Search Engine Backend (From Scratch)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Educational Project](https://img.shields.io/badge/Status-Educational-blue)](https://github.com/yourusername/search-engine)

> A from-scratch implementation of a search engine backend. Built for deep understanding of search algorithms, not for enterprise scale.

## 📖 Overview

Instead of relying on pre-built solutions like Elasticsearch or Algolia, this project implements the fundamental data structures and algorithms that power modern search systems. It is built step-by-step to expose the hidden logic behind web crawling, inverted indexing, and relevance ranking.

## ✨ Core Pipeline

This engine covers the full lifecycle of a search query:

- **Controlled Web Crawling:** Traverses the web from seed URLs, extracting links while respecting visited states and depth constraints.
- **HTML Parsing & Text Extraction:** Strips markup, scripts, and styles to extract pure text content from raw HTML.
- **Text Normalization & Tokenization:** Cleans text (lowercasing, punctuation removal) and breaks it down into indexable tokens.
- **Inverted Index Construction:** Maps individual terms to their document IDs and frequencies for O(1) instantaneous lookups.
- **Relevance Ranking (BM25):** Implements the Okapi BM25 algorithm to score documents based on term frequency and inverse document frequency.
- **Authority Ranking (PageRank):** Analyzes the link graph between scraped pages to calculate inbound authority scores.
- **Query-Time Scoring:** Combines BM25 relevance and PageRank authority to deliver the most accurate, highly-ranked results to the user.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Network:** `axios` (HTTP requests)
- **Parsing:** `cheerio` (DOM traversal and data extraction)
- **Storage:** Local File System (`fs`) & JSON (for transparent data inspection)

## 📂 Project Structure

```text
search-engine/
├── crawler/
│   └── crawler.js       # Fetches HTML and extracts links
├── indexer/
│   └── indexer.js       # Parses HTML, tokenizes text, builds inverted index
├── ranker/
│   ├── bm25.js          # Relevance scoring logic
│   └── pagerank.js      # Link-graph authority scoring
├── search/
│   └── query.js         # Processes user input and returns ranked results
├── data/                # Generated JSON files (raw pages, index, etc.)
├── seeds/
│   └── seeds.json       # Initial URLs and crawler constraints
├── package.json
└── README.md

```

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone [https://github.com/yourusername/search-engine.git](https://github.com/yourusername/search-engine.git)
cd search-engine
npm install

```

### 2. Configure Seeds

Edit `seeds/seeds.json` to define where the crawler should start:

```json
[
  {
    "domain": "example.com",
    "maxPages": 50
  }
]

```


## 🤝 Contributing

This is an educational project! If you have ideas for algorithmic optimizations, better tokenization strategies, or cleaner data structures, feel free to open an issue or submit a pull request.

## 📄 License

This project is open-source and available under the [MIT License]().

