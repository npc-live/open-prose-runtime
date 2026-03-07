import { readFileSync } from 'fs';
import { parse } from '../plugin/src';

const code = readFileSync('test-simple-interp.prose', 'utf-8');
const result = parse(code);

console.log(JSON.stringify(result.program, null, 2));
