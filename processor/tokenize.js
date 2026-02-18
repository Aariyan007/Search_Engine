const fs = require("fs");
const path = require("path");

const stopwWords = new Set([
    "the", "is", "a", "an", "to", "of", "in", "on",
    "and", "or", "for", "with", "at", "by"
])

const documents = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/documents.json"), "utf-8")
);


function tokenize(text){
    return text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(word => word.length > 1 && !stopwWords.has(word));
}

const processedDocuments = documents.map(doc => {
    const tokens = tokenize(doc.rawText);
    return {
        docId: doc.docId,
        url: doc.url,
        title: doc.title,
        tokens,
        length:tokens.length
    }
})

fs.writeFileSync(path.join(__dirname, "../data/documents.json"), JSON.stringify(processedDocuments, null, 2));

console.log("Tokenization done");