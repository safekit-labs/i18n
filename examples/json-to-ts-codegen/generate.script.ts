#!/usr/bin/env bun

import { jsonToTs } from '../../src/json-to-ts';
import { join } from 'path';

// Bun provides these globals, but TypeScript needs explicit declarations
declare const process: typeof import('process');
declare const __dirname: string;

// Parse command line arguments
const args = process.argv.slice(2);
const continueOnError = args.includes('--continue-on-error');
const silent = args.includes('--silent');
const dryRun = args.includes('--dry-run');

// Example usage of the jsonToTs API
if (dryRun) {
  console.log('🔍 Dry run mode - validation only');
  // TODO: Add dry-run validation without file generation
} else {
  jsonToTs({
    translationsDir: join(__dirname, 'translations'),
    outputDir: join(__dirname, 'generated'),
    continueOnError,
    silent
  });

  if (!silent) {
    console.log('🎉 Code generation complete! Check the generated/ directory.');
  }
}