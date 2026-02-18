const fs = require("fs");
const path = require("path");

const documents = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/documents.json"), "utf-8")
);

const invertedIndex = {};

for(const doc of documents){
    const docId = doc.docId;
    for(const word of doc.tokens){
        if(!invertedIndex[word]){
            invertedIndex[word] = {};
        }
        if(!invertedIndex[word][docId]){
            invertedIndex[word][docId] = 0;
        }
        invertedIndex[word][docId]++;
    }
}

fs.writeFileSync(path.join(__dirname, "../data/invertedIndex.json"), JSON.stringify(invertedIndex, null, 2));

console.log("Indexing done");