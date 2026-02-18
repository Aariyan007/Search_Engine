const fs = require("fs");
const path = require("path");

const rawPages = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/rawPages.json"), "utf-8")
);

const damping = 0.85;
const iterations = 10;
const pages = rawPages.map(p => p.url);
const N = pages.length;
let ranks = {};
pages.forEach(url => {
    ranks[url] = 1 / N;
});
const linksMap = {};
rawPages.forEach(p => {
    linksMap[p.url] = p.link.filter(l => pages.includes(l));
});
for (let i = 0; i < iterations; i++) {
    let newRanks = {};

    pages.forEach(url => {
        newRanks[url] = (1 - damping) / N;
    });

    pages.forEach(url => {
        const outgoing = linksMap[url];
        if (outgoing.length === 0) return;

        const share = ranks[url] / outgoing.length;

        outgoing.forEach(dest => {
            newRanks[dest] += damping * share;
        });
    });

    ranks = newRanks;
}

const pageRankData = pages.map((url, i) => ({
    docId: `doc_${i + 1}`,
    url,
    score: ranks[url]
}));

fs.writeFileSync(
    path.join(__dirname, "../data/pageRank.json"),
    JSON.stringify(pageRankData, null, 2)
);

console.log("PageRank computed");
