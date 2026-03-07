#!/usr/bin/env bun

import { parse } from '../plugin/src/parser';

const code = `
agent tester:
  model: sonnet
  prompt: "You are a helpful tester"

let chained = session: tester "Generate the word: WORLD"
  -> session: tester "Add exclamation to: {result}"
`;

const result = parse(code);

console.log('Parse result:', result);

if (result.errors && result.errors.length > 0) {
  console.log('Parse errors:');
  result.errors.forEach(err => console.log(`  ${err.message}`));
}

console.log('\nAST (formatted):');
if (result.ast) {
  // Find the let binding statement
  const letBinding = result.ast.statements.find((s: any) => s.type === 'LetBinding');
  if (letBinding) {
    console.log('Let binding value type:', letBinding.value.type);
    console.log(JSON.stringify(letBinding.value, null, 2));
  }
} else {
  console.log('No AST generated');
}
