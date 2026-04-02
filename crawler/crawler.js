const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const seeds = require('../seeds/seeds.json');
const path = require('path');

const visited = new Set();
const rawPages = [];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function crawlSite(seed){
    const baseUrl = `https://${seed.domain}`;
    const queue = [baseUrl];

    while(queue.length > 0 && visited.size < seed.maxPages){
        const url = queue.shift();
        if(visited.has(url)) continue;
        visited.add(url);
        console.log("Crawling:", url);

        try{
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);
            const link = [];

            $("a").each((_, el)=>{
                const href = $(el).attr("href");
                if(!href) return;

                let fullUrl;
                try {
                    fullUrl = new URL(href, baseUrl).href;
                } catch(e) {
                    return;
                }

                if(fullUrl.includes(seed.domain)){
                    link.push(fullUrl);
                }
            });

            rawPages.push({url, html, link});

            for(const l of link){
                if(!visited.has(l)){
                    queue.push(l);
                }
            }

            await delay(1000);

        } catch(err){
            console.log("Failed to fetch", url, err.message);
        }
    }
}

async function startCrawler(){
    for(const seed of seeds){
        await crawlSite(seed);
    }

    const dataDir = path.join(__dirname, '../data');
    const filePath = path.join(dataDir, 'rawPages.json');
    fs.writeFileSync(filePath, JSON.stringify(rawPages, null, 2));
    console.log("Crawling done");
}

startCrawler();