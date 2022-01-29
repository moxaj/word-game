const fs = require('fs');
fs.writeFileSync(
    'validWords.ts',
    `const words = [\n${fs
        .readFileSync('words.txt', 'utf-8')
        .split(/\r?\n/)
        .map(word => word.trim().toLocaleLowerCase())
        .filter(word => /^[qwertzuiopőúasdfghjkléáűíyxcvbnmöüó]{5}$/.test(word))
        .map(word => `'${word}'`)
        .join(',\n')}];`,
    'utf-8');