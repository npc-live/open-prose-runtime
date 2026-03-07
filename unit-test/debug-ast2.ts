import { readFileSync } from 'fs';
import { parse } from '../plugin/src';

const code = readFileSync('test-simple-interp3.prose', 'utf-8');
const result = parse(code);

// Find the session statement
const letBinding = result.program.statements.find((s: any) => s.type === 'LetBinding' && s.name.name === 'msg');
console.log('Let binding for msg:');
console.log(JSON.stringify(letBinding, null, 2));
