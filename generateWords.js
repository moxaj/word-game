const fs = require('fs');
fs.writeFileSync(
    'src/words.ts',
    `export const words = [\n${fs
        .readFileSync('words.txt', 'utf-8')
        .split(/\r?\n/)
        .map(word => word.trim())
        .filter(word => /^[qwertzuiopőúasdfghjkléáűíyxcvbnmöüó]{5}$/.test(word))
        .map(word => `'${word}'`)
        .join(',\n')}];`,
    'utf-8');