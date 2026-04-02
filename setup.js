const fs = require('fs');

console.log('Setting up Search Engine...');

if(!fs.existsSync('./data')){
    fs.mkdirSync('./data');
    console.log(' data/ folder created...');
}

if(!fs.existsSync('./seeds')){
    fs.mkdirSync('./seeds');
    console.log('seeds/ folder created...');
}

if(!fs.existsSync('./seeds/seeds.json')){
    const defaultSeeds = [
        {
            "domain": "example.com",
            "maxPages": 10
        }
    ];
    fs.writeFileSync(
        './seeds/seeds.json',
        JSON.stringify(defaultSeeds, null, 2)
    );
    console.log('seeds/seeds.json created....');
}

console.log('');
console.log('Setup complete!');
console.log('Edit seeds/seeds.json to add your websites');
console.log('Then run: npm start....');