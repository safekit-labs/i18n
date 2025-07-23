#!/usr/bin/env bun

import { tsToJson } from '../../src/ts-to-json';
import { join } from 'path';

// Bun provides these globals, but TypeScript needs explicit declarations
declare const process: typeof import('process');
declare const __dirname: string;

// Parse command line arguments
const args = process.argv.slice(2);
const continueOnError = args.includes('--continue-on-error');
const silent = args.includes('--silent');
const dryRun = args.includes('--dry-run');
const schemaName = args.find(arg => arg.startsWith('--schema-name='))?.split('=')[1];

// Example usage of the tsToJson API
if (dryRun) {
  console.log('🔍 Dry run mode - validation only');
  // TODO: Add dry-run validation without file generation
} else {
  tsToJson({
    translationsDir: join(__dirname, 'translations'),
    outputDir: join(__dirname, 'generated'),
    schemaName,
    continueOnError,
    silent
  });

  if (!silent) {
    console.log('🎉 JSON generation complete! Check the generated/ directory.');
    if (schemaName) {
      console.log(`📄 Custom schema: $${schemaName}-schema.json`);
    }
  }
}