/**
 * Simple regex-based Markdown to HTML converter for Apple Notes
 * Handles common patterns sufficient for note-taking
 */

/**
 * Converts markdown text to HTML that Apple Notes can render
 * @param markdown - The markdown text to convert
 * @returns HTML string
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML entities first (except we'll be adding our own tags)
  html = html.replace(/&/g, '&amp;');

  // Horizontal rules (must be before list processing)
  html = html.replace(/^---+$/gm, '<hr>');
  html = html.replace(/^\*\*\*+$/gm, '<hr>');
  html = html.replace(/^___+$/gm, '<hr>');

  // Headings (must process before bold/italic to avoid conflicts)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic (order matters - process bold+italic combo first)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>');
  html = html.replace(/___(.+?)___/g, '<b><i>$1</i></b>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  html = html.replace(/__(.+?)__/g, '<b>$1</b>');
  html = html.replace(/\*([^*\n]+)\*/g, '<i>$1</i>');
  html = html.replace(/_([^_\n]+)_/g, '<i>$1</i>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Process unordered lists (- item or * item)
  html = processUnorderedLists(html);

  // Process ordered lists (1. item)
  html = processOrderedLists(html);

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

  // Convert remaining newlines to <br> (but not after block elements)
  html = html.replace(/\n(?!<\/(h[1-6]|ul|ol|li|blockquote|hr)>)/g, '<br>');

  // Clean up any double <br> tags
  html = html.replace(/(<br>){3,}/g, '<br><br>');

  return html;
}

/**
 * Process unordered list items and wrap them in <ul> tags
 */
function processUnorderedLists(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let listItems: string[] = [];

  for (const line of lines) {
    const match = line.match(/^[\-\*] (.+)$/);
    if (match) {
      listItems.push(`<li>${match[1]}</li>`);
    } else {
      if (listItems.length > 0) {
        // Close list without newlines between items
        result.push(`<ul>${listItems.join('')}</ul>`);
        listItems = [];
      }
      result.push(line);
    }
  }

  if (listItems.length > 0) {
    result.push(`<ul>${listItems.join('')}</ul>`);
  }

  return result.join('\n');
}

/**
 * Process ordered list items and wrap them in <ol> tags
 */
function processOrderedLists(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let listItems: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\d+\. (.+)$/);
    if (match) {
      listItems.push(`<li>${match[1]}</li>`);
    } else {
      if (listItems.length > 0) {
        // Close list without newlines between items
        result.push(`<ol>${listItems.join('')}</ol>`);
        listItems = [];
      }
      result.push(line);
    }
  }

  if (listItems.length > 0) {
    result.push(`<ol>${listItems.join('')}</ol>`);
  }

  return result.join('\n');
}
