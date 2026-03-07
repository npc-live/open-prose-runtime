#!/usr/bin/env bun
/**
 * Test custom tool registration
 */

import { parse } from './plugin/src/parser/index.js';
import { execute, ToolDefinition } from './plugin/src/runtime/index.js';

// Define custom tools
const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get current weather for a location (mock)',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name',
      },
      units: {
        type: 'string',
        description: 'Temperature units',
        enum: ['celsius', 'fahrenheit'],
      },
    },
    required: ['city'],
  },
  handler: async (args: any) => {
    const { city, units = 'celsius' } = args;
    // Mock weather data
    return {
      city,
      temperature: units === 'celsius' ? 22 : 72,
      condition: 'sunny',
      humidity: 65,
      units,
    };
  },
};

const translateTool: ToolDefinition = {
  name: 'translate',
  description: 'Translate text to another language (mock)',
  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text to translate',
      },
      target_language: {
        type: 'string',
        description: 'Target language',
        enum: ['spanish', 'french', 'german', 'chinese'],
      },
    },
    required: ['text', 'target_language'],
  },
  handler: async (args: any) => {
    const { text, target_language } = args;
    // Mock translations
    const translations: Record<string, string> = {
      spanish: `${text} (traducido al español)`,
      french: `${text} (traduit en français)`,
      german: `${text} (ins Deutsche übersetzt)`,
      chinese: `${text} (翻译成中文)`,
    };
    return translations[target_language] || text;
  },
};

// Define a test program
const programSource = `
# Test Custom Tools

agent weather_assistant:
  model: sonnet
  skills: ["get_weather"]
  prompt: "You are a weather assistant"

agent translator:
  model: sonnet
  skills: ["translate", "string_operations"]
  prompt: "You are a translation assistant"

# Test custom weather tool
let weather = session: weather_assistant
  prompt: "What's the weather like in Tokyo?"

# Test custom translate tool
let translation = session: translator
  prompt: "Translate 'Hello World' to Spanish"
`;

async function main() {
  console.log('🧪 Testing Custom Tool Registration\n');

  // Parse the program
  const parseResult = parse(programSource);
  if (!parseResult.program) {
    console.error('Parse failed - no program returned');
    console.error('Errors:', parseResult.errors);
    return;
  }

  if (parseResult.errors && parseResult.errors.length > 0) {
    console.warn('Parse warnings:', parseResult.errors);
  }

  console.log('✓ Parse successful\n');

  // Execute with custom tools
  console.log('📝 Registering custom tools: get_weather, translate\n');

  const result = await execute(parseResult.program!, {}, [weatherTool, translateTool]);

  if (result.success) {
    console.log('\n✅ Execution completed successfully\n');

    console.log('Results:');
    for (const [name, value] of result.outputs) {
      if (typeof value === 'object' && value !== null && 'output' in value) {
        console.log(`\n${name}:`);
        console.log(`  Output: ${value.output}`);
        if (value.metadata?.toolCalls) {
          console.log(`  Tool calls:`);
          for (const tc of value.metadata.toolCalls) {
            console.log(`    - ${tc.name}(${JSON.stringify(tc.arguments)}) → ${JSON.stringify(tc.result)}`);
          }
        }
      }
    }
  } else {
    console.log('\n❌ Execution failed\n');
    for (const error of result.errors) {
      console.error(`  ${error.type}: ${error.message}`);
    }
  }
}

main().catch(console.error);
