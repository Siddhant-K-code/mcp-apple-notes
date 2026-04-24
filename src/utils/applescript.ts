import { execSync } from 'child_process';
import type { AppleScriptResult } from '@/types.js';

/**
 * Executes an AppleScript command using multiple -e flags
 * This is the recommended approach by Apple for multi-line scripts
 * @param script - The AppleScript command to execute
 * @returns Object containing success status and output/error
 */
export function runAppleScript(script: string): AppleScriptResult {
  try {
    // Split script into lines and filter empty lines
    const lines = script
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Validation: check for empty script
    if (lines.length === 0) {
      return {
        success: false,
        output: '',
        error: 'Empty AppleScript provided'
      };
    }

    // Build command with multiple -e flags (one per line)
    const eFlags = lines
      .map(line => {
        // Escape single quotes for shell safety
        const escaped = line.replace(/'/g, "'\\''");
        return `-e '${escaped}'`;
      })
      .join(' ');

    const command = `osascript ${eFlags}`;

    // Execute the command
    const output = execSync(command, {
      encoding: 'utf8',
      timeout: 10000, // 10 second timeout
      stdio: ['pipe', 'pipe', 'pipe'] // Capture all output
    });

    return {
      success: true,
      output: output.trim()
    };
  } catch (error: any) {
    // Capture stderr if available for better debugging
    const stderr = error.stderr?.toString() || '';
    const errorMessage = stderr || error.message || 'Unknown error';

    // Use stderr for debugging in MCP context (stdout is for JSON-RPC)
    if (process.stderr) {
      process.stderr.write(`AppleScript execution failed: ${errorMessage}\n`);
    }

    return {
      success: false,
      output: '',
      error: `Failed to execute AppleScript: ${errorMessage}`
    };
  }
}
