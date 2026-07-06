/* Roda todos os *.test.js em processos isolados e agrega o resultado. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.test.js')).sort();
let falhou = 0;

console.log('== Rodando ' + files.length + ' arquivo(s) de teste ==');
for (const f of files) {
  console.log('\n### ' + f + ' ###');
  try {
    process.stdout.write(execFileSync('node', [path.join(dir, f)], { encoding: 'utf8' }));
  } catch (e) {
    if (e.stdout) process.stdout.write(e.stdout);
    if (e.stderr) process.stderr.write(e.stderr);
    falhou++;
  }
}

console.log('\n========================================');
console.log(falhou === 0 ? '  TODOS OS ARQUIVOS PASSARAM' : '  ' + falhou + ' ARQUIVO(S) COM FALHA');
console.log('========================================');
process.exit(falhou === 0 ? 0 : 1);
