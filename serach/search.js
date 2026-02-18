const fs = require("fs");
const path = require("path");
const bm25Score = require("../rank/bm25");
const documents = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/documents.json"), "utf-8")
);
const pageRanks = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/pageRank.json"), "utf-8")
);

const stopwords = new Set([
    "the", "is", "a", "an", "to", "of", "in", "on",
    "and", "or", "for", "with", "at", "by"
]);

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 1 && !stopwords.has(w));
}
const pageRankMap = {};
pageRanks.forEach(p => {
    pageRankMap[p.docId] = p.score;
});

function search(query) {
    const queryTokens = tokenize(query);
    const relevanceScores = bm25Score(queryTokens);
    const results = [];

    for (const docId in relevanceScores) {
        const bm25 = relevanceScores[docId];
        const pr = pageRankMap[docId] || 0;

        const finalScore =
            bm25 * 0.7 +   
            pr * 0.3;       // authority

        const doc = documents.find(d => d.docId === docId);

        results.push({
            docId,
            title: doc.title,
            url: doc.url,
            score: finalScore
        });
    }
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 10);
}
const query = process.argv.slice(2).join(" ");
const output = search(query);

console.log("\nSearch results:\n");
output.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   ${r.url}`);
});
