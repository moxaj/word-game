const fs = require('fs');
const validWords = fs
    .readFileSync('words.txt', 'utf-8')
    .split(/\r?\n/)
    .map(word => word.trim().toLocaleLowerCase())
    .filter(word => /^[qwertzuiopőúasdfghjkléáűíyxcvbnmöüó]{5}$/.test(word))
    .map(word => `'${word}'`);
fs.writeFileSync('validWords.ts', `const words = [\n${validWords.join(',\n')}];`, 'utf-8');