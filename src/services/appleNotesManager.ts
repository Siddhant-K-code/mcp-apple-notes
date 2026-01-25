import type { Note } from '@/types.js';
import { runAppleScript } from '@/utils/applescript.js';

/**
 * Formats note content for AppleScript compatibility
 * @param content - The raw note content
 * @returns Formatted content with proper line breaks
 */
const formatContent = (content: string): string => {
  if (!content) return '';

  // Define replacement patterns for text formatting
  const replacements: [string, RegExp][] = [
    ['\n', /\n/g],
    ['\t', /\t/g],
    ['"', /"/g], // Escape quotes for AppleScript
  ];

  return replacements.reduce(
    (text, [char, pattern]) => text.replace(pattern, char === '"' ? '\\"' : '<br>'),
    content
  );
};

export class AppleNotesManager {
  private readonly ICLOUD_ACCOUNT = "iCloud";

  /**
   * Creates a new note in Apple Notes
   * @param title - The note title
   * @param content - The note content
   * @param tags - Optional array of tags
   * @param folder - Optional folder name (Apple Notes folders are flat, use exact folder name e.g., "Work")
   * @returns The created note object or null if creation fails
   */
  createNote(title: string, content: string, tags: string[] = [], folder?: string): Note | null {
    const formattedContent = formatContent(content);
    const escapedTitle = title.replace(/"/g, '\\"');

    // Build AppleScript with optional folder targeting
    // Note: Apple Notes folders are flat at the account level in AppleScript
    let script: string;
    if (folder) {
      const escapedFolder = folder.replace(/"/g, '\\"');
      script = `
        tell application "Notes"
          tell account "${this.ICLOUD_ACCOUNT}"
            tell folder "${escapedFolder}"
              make new note with properties {name:"${escapedTitle}", body:"${formattedContent}"}
            end tell
          end tell
        end tell
      `;
    } else {
      script = `
        tell application "Notes"
          tell account "${this.ICLOUD_ACCOUNT}"
            make new note with properties {name:"${escapedTitle}", body:"${formattedContent}"}
          end tell
        end tell
      `;
    }

    const result = runAppleScript(script);
    if (!result.success) {
      console.error('Failed to create note:', result.error);
      return null;
    }

    return {
      id: Date.now().toString(),
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
    const sanitizedQuery = query.replace(/"/g, '\\"');
    const script = `
      tell application "Notes"
        tell account "${this.ICLOUD_ACCOUNT}"
          get name of notes where name contains "${sanitizedQuery}"
        end tell
      end tell
    `;

    const result = runAppleScript(script);
    if (!result.success) {
      console.error('Failed to search notes:', result.error);
      return [];
    }

    return result.output
      .split(',')
      .filter(Boolean)
      .map(title => ({
        id: Date.now().toString(),
        title: title.trim(),
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
    const sanitizedTitle = title.replace(/"/g, '\\"');
    const script = `
      tell application "Notes"
        tell account "${this.ICLOUD_ACCOUNT}"
          get body of note "${sanitizedTitle}"
        end tell
      end tell
    `;

    const result = runAppleScript(script);
    if (!result.success) {
      console.error('Failed to get note content:', result.error);
      return '';
    }

    return result.output;
  }
}
