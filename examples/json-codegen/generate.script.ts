#!/usr/bin/env bun

import { generateTypes } from '../../src/codegen';
import { join } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const continueOnError = args.includes('--continue-on-error');
const silent = args.includes('--silent');
const dryRun = args.includes('--dry-run');

// Example usage of the generateTypes API
if (dryRun) {
  console.log('🔍 Dry run mode - validation only');
  // TODO: Add dry-run validation without file generation
} else {
  generateTypes({
    translationsDir: join(__dirname, 'translations'),
    outputDir: join(__dirname, 'generated'),
    continueOnError,
    silent
  });

  if (!silent) {
    console.log('🎉 Code generation complete! Check the generated/ directory.');
  }
}