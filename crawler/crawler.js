const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');   
const seeds = require('../seeds/seeds.json');
const path = require('path');

const visited = new Set();
const rawPages = [];

async function crawlSite(seed){
    const queue = [`https://${seed.domain}`];

    while(queue.length > 0 && visited.size < seed.maxPages){
        const url = queue.shift();
        if(visited.has(url)) continue;
        visited.add(url);
        console.log("Crawling:",url);
        try{
            const respone = await axios.get(url);
            const html = respone.data;
            const $ = cheerio.load(html);

            const link = [];
            $("a").each((_, el)=>{
                const href = $(el).attr("href");

                if (href && href.startsWith("http") && href.includes(seed.domain)){
                    link.push(href);
                }
            })

            rawPages.push({url, html,link});
            for(const l of link){
                if(!visited.has(l)){
                    queue.push(l);
                }
            }
        }
        catch(err){
            console.log("Failed");
        }
    }
}

async function startCrawler(){
    for(const seed of seeds){
        await crawlSite(seed);
    }
    const dataDir = path.join(__dirname, '../data');
    const filePath = path.join(dataDir, 'rawPages.json');
    fs.writeFileSync(filePath,JSON.stringify(rawPages,null,2));
    console.log("Crawling done");
}

startCrawler();