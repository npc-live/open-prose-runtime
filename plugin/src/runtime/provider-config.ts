/**
 * Provider configuration loader
 *
 * Config lookup order (first found wins, then merged with lower-priority):
 *   1. .open-prose.json  in the current working directory
 *   2. ~/.config/open-prose/providers.json  (global user config)
 *   3. Built-in presets (fallback)
 *
 * Example .open-prose.json:
 * {
 *   "providers": {
 *     "opencode": {
 *       "bin": "opencode",
 *       "args": ["run"],
 *       "promptMode": "arg"
 *     },
 *     "mycli": {
 *       "bin": "/usr/local/bin/mycli",
 *       "args": ["--message"],
 *       "promptMode": "arg",
 *       "timeout": 120000
 *     }
 *   }
 * }
 */

import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import type { CliConfig } from './cli-provider';

export interface ProseConfig {
  providers?: Record<string, Partial<CliConfig>>;
}

/** Built-in provider presets */
const BUILTIN_PRESETS: Record<string, CliConfig> = {
  'claude-code': {
    name: 'claude-code',
    bin: 'claude',
    promptMode: 'stdin',
    stdinArgs: ['--output-format', 'stream-json', '--verbose'],
    outputFormat: 'stream-json',
  },
  claude: {
    name: 'claude',
    bin: 'claude',
    promptMode: 'stdin',
    stdinArgs: ['--output-format', 'stream-json', '--verbose'],
    outputFormat: 'stream-json',
  },
  opencode: {
    name: 'opencode',
    bin: 'opencode',
    promptMode: 'arg',
    args: ['run'],
  },
  aider: {
    name: 'aider',
    bin: 'aider',
    promptMode: 'arg',
    args: ['--message'],
  },
};

function tryReadJson(filePath: string): ProseConfig | null {
  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as ProseConfig;
  } catch {
    return null;
  }
}

function loadProseConfig(): ProseConfig {
  // 1. Project-level: .open-prose.json in cwd
  const projectConfig = tryReadJson(resolve(process.cwd(), '.open-prose.json'));

  // 2. Global user config: ~/.config/open-prose/providers.json
  const globalConfig = tryReadJson(join(homedir(), '.config', 'open-prose', 'providers.json'));

  // Merge: project overrides global, global overrides builtins
  const merged: ProseConfig = { providers: {} };

  if (globalConfig?.providers) {
    Object.assign(merged.providers!, globalConfig.providers);
  }
  if (projectConfig?.providers) {
    // Deep-merge each provider entry so you can override individual fields
    for (const [name, overrides] of Object.entries(projectConfig.providers)) {
      merged.providers![name] = { ...(merged.providers![name] ?? {}), ...overrides };
    }
  }

  return merged;
}

// Singleton: loaded once per process
let _config: ProseConfig | null = null;
function getConfig(): ProseConfig {
  if (!_config) _config = loadProseConfig();
  return _config;
}

/**
 * Resolve a provider name / string to a full CliConfig.
 *
 * Priority:
 *   1. User config (project or global) — can override or add providers
 *   2. Built-in preset
 *   3. custom:bin [args...]  shorthand
 *
 * Returns null if not resolvable.
 */
export function resolveProviderConfig(provider: string): CliConfig | null {
  const cfg = getConfig();

  // User-defined override/addition
  const userEntry = cfg.providers?.[provider];
  if (userEntry) {
    // Merge with builtin preset as base (if exists), then apply user overrides
    const base: CliConfig = BUILTIN_PRESETS[provider] ?? {
      name: provider,
      bin: provider,
      promptMode: 'stdin',
    };
    return { ...base, ...userEntry, name: userEntry.name ?? base.name };
  }

  // Built-in preset
  if (BUILTIN_PRESETS[provider]) {
    return { ...BUILTIN_PRESETS[provider] };
  }

  // custom:bin [arg1 arg2 ...]
  if (provider.startsWith('custom:')) {
    const parts = provider.slice('custom:'.length).trim().split(/\s+/);
    return {
      name: parts[0],
      bin: parts[0],
      promptMode: 'stdin',
      stdinArgs: parts.slice(1),
    };
  }

  return null;
}

/** Return list of all known provider names (builtin + user-configured) */
export function listProviders(): string[] {
  const cfg = getConfig();
  const names = new Set([
    ...Object.keys(BUILTIN_PRESETS),
    ...Object.keys(cfg.providers ?? {}),
  ]);
  return [...names].sort();
}
