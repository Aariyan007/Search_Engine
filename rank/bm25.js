const fs = require('fs');
const path = require('path');

const documents = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/documents.json"), "utf-8")
);
const invertedIndex = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/invertedIndex.json"), "utf-8")
);

const k1 = 1.5;
const b = 0.75;

const avgDocLen = documents.reduce((sum,d)=> sum + d.length,0) / documents.length;
const docLength={};
for(const doc of documents){
    docLength[doc.docId] = doc.length;
}

function bm25Score(queryTokens) {
    const scores = {};
    const N = documents.length;

    for (const term of queryTokens) {
        const posting = invertedIndex[term];
        if (!posting) continue;

        const df = Object.keys(posting).length;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

        for (const docId in posting) {
            const tf = posting[docId];
            const dl = docLength[docId];

            const numerator = tf * (k1 + 1);
            const denominator =
                tf +
                k1 * (1 - b + b * (dl / avgDocLen));

            const score = idf * (numerator / denominator);

            if (!scores[docId]) scores[docId] = 0;
            scores[docId] += score;
        }
    }

    return scores;
}

module.exports = bm25Score;
