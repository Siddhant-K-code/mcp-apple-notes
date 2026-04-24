import type { Note } from '@/types.js';
import { runAppleScript } from '@/utils/applescript.js';

/**
 * Escapes string for safe use in AppleScript titles
 */
const escapeAppleScriptString = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')   // Escape backslashes first
    .replace(/"/g, '\\"')      // Escape double quotes
    .replace(/\r/g, '');       // Remove carriage returns
};

/**
 * Sanitizes text for safe HTML insertion
 * Escapes HTML special characters to prevent XSS and rendering issues
 */
const sanitizeForHTML = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Sanitizes text for insertion into HTML within AppleScript
 * Escapes special characters but keeps quotes compatible with AppleScript
 */
const sanitizeForAppleScriptHTML = (text: string): string => {
  if (!text) return '';
  // Order matters: escape backslashes first, then quotes
  return text
    .replace(/\\/g, '\\\\')    // Escape backslashes first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&#8220;')  // Use Unicode left double quotation mark
    .replace(/'/g, '&#39;');
};

/**
 * Detects if HTML contains nested lists
 */
const hasNestedLists = (html: string): boolean => {
  // Using dotAll flag (s) for better performance with multiline HTML
  // The pattern matches <li> tags that contain nested <ul> or <ol> tags
  return /<li[^>]*>.*?<(?:ul|ol)[\s>]/is.test(html);
};

/**
 * Converts nested lists to div-based format for Apple Notes compatibility
 */
const convertNestedListsToDivs = (html: string): string => {
  // Process ordered lists that contain nested lists
  let result = html;

  // Find and process each ordered list
  result = result.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    if (!hasNestedLists(match)) {
      return match; // No nesting, keep as is
    }

    let converted = '';
    let mainItemCounter = 0;
    let currentPos = 0;
    const content = listContent;

    // Find each top-level <li> by tracking depth
    while (currentPos < content.length) {
      const liStart = content.indexOf('<li', currentPos);
      if (liStart === -1) break;

      // Find the matching </li> for this <li>
      let depth = 1;
      let searchPos = liStart + 3;
      let liEnd = -1;

      while (depth > 0 && searchPos < content.length) {
        const nextLi = content.indexOf('<li', searchPos);
        const nextCloseLi = content.indexOf('</li>', searchPos);

        if (nextCloseLi === -1) break;

        if (nextLi !== -1 && nextLi < nextCloseLi) {
          // Found another opening <li>
          depth++;
          searchPos = nextLi + 3;
        } else {
          // Found a closing </li>
          depth--;
          if (depth === 0) {
            liEnd = nextCloseLi + 5; // Include the </li>
          } else {
            searchPos = nextCloseLi + 5;
          }
        }
      }

      if (liEnd === -1) {
        // Couldn't find matching </li>, skip
        currentPos = content.length;
        continue;
      }

      // Extract this complete <li>...</li> item
      const fullItem = content.substring(liStart, liEnd);
      const itemContent = fullItem.replace(/^<li[^>]*>|<\/li>$/gi, '');

      mainItemCounter++;

      // Check if this item has a nested list
      if (/<(?:ul|ol)[\s>]/i.test(itemContent)) {
        // Extract main text (before nested list)
        // First remove the nested list part, then strip any remaining HTML tags
        const rawMainText = itemContent.replace(/<(?:ul|ol)[\s\S]*$/i, '').trim();
        // Remove any HTML tags from the main text to get plain text
        const mainText = rawMainText.replace(/<[^>]*>/g, '').trim();

        // Extract nested items
        const nestedItems: string[] = [];
        const nestedListMatch = itemContent.match(/<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/i);

        if (nestedListMatch) {
          const nestedContent = nestedListMatch[1];
          const nestedLis = nestedContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
          nestedLis.forEach((li: string) => {
            // Extract content and remove HTML tags to get plain text
            const rawContent = li.replace(/<\/?li[^>]*>/gi, '').trim();
            const content = rawContent.replace(/<[^>]*>/g, '').trim();
            if (content) {
              nestedItems.push(content);
            }
          });
        }

        // Build formatted output
        // Use AppleScript-specific sanitization for nested lists
        converted += `<div><b><font color=\\"#0066CC\\">${mainItemCounter}. ${sanitizeForAppleScriptHTML(mainText)}</font></b></div>`;
        nestedItems.forEach(subitem => {
          // Use AppleScript-specific sanitization for nested lists
          converted += `<div>&nbsp;&nbsp;&nbsp;&nbsp;• ${sanitizeForAppleScriptHTML(subitem)}</div>`;
        });

        // Add space between main items
        converted += '<div><br></div>';
      } else {
        // Simple item without nesting - use AppleScript-specific sanitization
        converted += `<div><b>${mainItemCounter}. ${sanitizeForAppleScriptHTML(itemContent.trim())}</b></div>`;
      }

      currentPos = liEnd;
    }

    return converted;
  });

  return result;
};

/**
 * Formats content for Apple Notes with proper line breaks
 * Apple Notes accepts HTML formatting in the body
 */
const formatNoteContent = (content: string): string => {
  if (!content) return '';

  // First escape quotes for AppleScript
  let formatted = content
    .replace(/\\/g, '\\\\')     // Escape backslashes first
    .replace(/"/g, '\\"');       // Escape double quotes

  // Check if content already contains HTML tags
  const hasHTMLTags = /<[^>]+>/.test(formatted);

  if (hasHTMLTags) {
    // First, clean up whitespace in ALL lists (both simple and nested)
    // This prevents empty <li><br></li> items in Apple Notes
    formatted = formatted
      .replace(/(<(?:ol|ul)[^>]*>)\s*\n\s*/gi, '$1')  // Remove whitespace after opening list tags
      .replace(/\s*\n\s*(<\/(?:ol|ul)>)/gi, '$1')     // Remove whitespace before closing list tags
      .replace(/(<\/li>)\s*\n\s*(<li)/gi, '$1$2')     // Remove whitespace between list items
      .replace(/(<(?:ol|ul)[^>]*>)\s*\n\s*(<li)/gi, '$1$2')  // Remove whitespace between list start and first item
      .replace(/(<\/li>)\s*\n\s*(<\/(?:ol|ul)>)/gi, '$1$2'); // Remove whitespace between last item and list end

    // Then check for nested lists and convert them if found
    if (hasNestedLists(formatted)) {
      formatted = convertNestedListsToDivs(formatted);
    }

    // Convert newlines to <br> tags, but only for newlines that are NOT inside HTML tags
    // Regex explanation: \n(?![^<]*>)
    // - \n: Match a newline character
    // - (?!...): Negative lookahead - only match if NOT followed by...
    // - [^<]*: Any number of non-'<' characters
    // - >: Followed by a closing '>'
    // This ensures we don't add <br> inside HTML tag attributes or between tag delimiters
    formatted = formatted.replace(/\n(?![^<]*>)/g, '<br>');
  } else {
    // For plain text, simply convert newlines to HTML line breaks
    formatted = formatted.replace(/\n/g, '<br>');
  }

  // Wrap in HTML for better formatting
  return `<html><body>${formatted}</body></html>`;
};

/**
 * Generates unique ID for notes
 */
const generateNoteId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export class AppleNotesManager {
  private readonly ICLOUD_ACCOUNT = "iCloud";
  private accountName: string | null = null;

  constructor() {
    this.accountName = this.detectAvailableAccount();
  }

  /**
   * Detects which account to use (iCloud or default)
   */
  private detectAvailableAccount(): string | null {
    const testScript = `
tell application "Notes"
  tell account "${this.ICLOUD_ACCOUNT}"
    return "OK"
  end tell
end tell
    `.trim();

    const result = runAppleScript(testScript);

    if (result.success) {
      // Use stderr for logging in MCP context (stdout is for JSON-RPC)
      if (process.stderr) {
        process.stderr.write('✅ Using iCloud account\n');
      }
      return this.ICLOUD_ACCOUNT;
    }

    // Use stderr for logging in MCP context
    if (process.stderr) {
      process.stderr.write('⚠️  iCloud not available, using default account\n');
    }
    return null;
  }

  /**
   * Builds AppleScript with or without account specification
   */
  private buildScript(command: string): string {
    if (this.accountName) {
      return `
tell application "Notes"
  tell account "${this.accountName}"
    ${command}
  end tell
end tell
      `.trim();
    }

    return `
tell application "Notes"
  ${command}
end tell
    `.trim();
  }

  /**
   * Gets the name of the account being used
   */
  getCurrentAccount(): string | null {
    return this.accountName;
  }

  /**
   * Creates a new note in Apple Notes
   * @param title - The note title
   * @param content - The note content
   * @param tags - Optional array of tags
   * @returns The created note object or null if creation fails
   */
  createNote(title: string, content: string, tags: string[] = []): Note | null {
    const escapedTitle = escapeAppleScriptString(title);
    const escapedContent = formatNoteContent(content);

    const command = `make new note with properties {name:"${escapedTitle}", body:"${escapedContent}"}`;
    const script = this.buildScript(command);
    const result = runAppleScript(script);

    if (!result.success) {
      // Use stderr for error logging in MCP context
      if (process.stderr) {
        process.stderr.write(`Failed to create note: ${result.error}\n`);
      }
      return null;
    }

    return {
      id: generateNoteId(),
      title,
      content,
      tags,
      created: new Date(),
      modified: new Date()
    };
  }

  /**
   * Searches for notes by title
   * @param query - The search query
   * @returns Array of matching notes
   */
  searchNotes(query: string): Note[] {
    const escapedQuery = escapeAppleScriptString(query);

    const command = `get name of notes where name contains "${escapedQuery}"`;
    const script = this.buildScript(command);
    const result = runAppleScript(script);

    if (!result.success) {
      // Use stderr for error logging in MCP context
      if (process.stderr) {
        process.stderr.write(`Failed to search notes: ${result.error}\n`);
      }
      return [];
    }

    // AppleScript returns comma-separated list with spaces
    return result.output
      .split(', ')
      .map(title => title.trim())
      .filter(Boolean)
      .map(title => ({
        id: generateNoteId(),
        title,
        content: '',
        tags: [],
        created: new Date(),
        modified: new Date()
      }));
  }

  /**
   * Retrieves the content of a specific note
   * @param title - The exact title of the note
   * @returns The note content or empty string if not found
   */
  getNoteContent(title: string): string {
    const escapedTitle = escapeAppleScriptString(title);

    const command = `get body of note "${escapedTitle}"`;
    const script = this.buildScript(command);
    const result = runAppleScript(script);

    if (!result.success) {
      // Use stderr for error logging in MCP context
      if (process.stderr) {
        process.stderr.write(`Failed to get note content: ${result.error}\n`);
      }
      return '';
    }

    return result.output;
  }
}
