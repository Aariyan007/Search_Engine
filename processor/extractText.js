const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const rawPages = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/rawPages.json'), 'utf-8'));
const documents = [];
for(let i = 0; i < rawPages.length; i++){
    const page = rawPages[i];
    const $ = cheerio.load(page.html);
    $("script").remove();
    $("style").remove();
    $("nav").remove();
    $("footer").remove();
    $("header").remove();
    const title = $("title").text().trim();
    let text = "";
    $("p").each((_,el)=>{
        text += $(el).text().trim() + " ";
    })
    documents.push({
        docId: `doc_${i + 1}`,
        // title: title,
        url : page.url,
        title,
        rawText : text.trim()
    });

}

fs.writeFileSync(
    path.join(__dirname, '../data/documents.json'),
    JSON.stringify(documents, null, 2)
);

console.log("Text extraction done");
