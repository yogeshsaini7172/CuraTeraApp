/**
 * MarkdownText - Lightweight Markdown renderer for chat bubbles.
 * Handles: **bold**, *italic*, `inline code`, ```code blocks```,
 * bullet lists (- or *), numbered lists, and ### headers.
 * Zero external dependencies — pure React Native.
 */
import React from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';

interface MarkdownTextProps {
  text: string;
  baseStyle?: TextStyle;
}

/**
 * Parse inline markdown tokens within a single line of text.
 * Returns an array of React elements with appropriate styling.
 */
const renderInlineMarkdown = (line: string, baseStyle?: TextStyle): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  // Regex: bold (**text**), italic (*text*), inline code (`text`)
  const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = inlineRegex.exec(line)) !== null) {
    // Push plain text before this match
    if (match.index > lastIndex) {
      elements.push(
        <Text key={`t-${key++}`} style={baseStyle}>
          {line.slice(lastIndex, match.index)}
        </Text>,
      );
    }

    if (match[2]) {
      // **bold**
      elements.push(
        <Text key={`b-${key++}`} style={[baseStyle, styles.bold]}>
          {match[2]}
        </Text>,
      );
    } else if (match[3]) {
      // *italic*
      elements.push(
        <Text key={`i-${key++}`} style={[baseStyle, styles.italic]}>
          {match[3]}
        </Text>,
      );
    } else if (match[4]) {
      // `inline code`
      elements.push(
        <Text key={`c-${key++}`} style={[baseStyle, styles.inlineCode]}>
          {match[4]}
        </Text>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining plain text
  if (lastIndex < line.length) {
    elements.push(
      <Text key={`t-${key++}`} style={baseStyle}>
        {line.slice(lastIndex)}
      </Text>,
    );
  }

  // If nothing was parsed, return the raw line
  if (elements.length === 0) {
    elements.push(
      <Text key="raw" style={baseStyle}>
        {line}
      </Text>,
    );
  }

  return elements;
};

export const MarkdownText: React.FC<MarkdownTextProps> = ({ text, baseStyle }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const rendered: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Code block (``` ... ```) ──
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++; // skip opening ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      rendered.push(
        <View key={`code-${i}`} style={styles.codeBlock}>
          <Text style={styles.codeBlockText}>{codeLines.join('\n')}</Text>
        </View>,
      );
      continue;
    }

    // ── Headers (### / ## / #) ──
    const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length; // 1, 2, or 3
      const headerStyle =
        level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
      rendered.push(
        <Text key={`h-${i}`} style={[baseStyle, headerStyle]}>
          {renderInlineMarkdown(headerMatch[2], { ...StyleSheet.flatten(baseStyle), ...StyleSheet.flatten(headerStyle) })}
        </Text>,
      );
      i++;
      continue;
    }

    // ── Bullet list (- item or * item) ──
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (bulletMatch) {
      rendered.push(
        <View key={`ul-${i}`} style={styles.listItem}>
          <Text style={[baseStyle, styles.bullet]}>{'•'}</Text>
          <Text style={[baseStyle, styles.listItemText]}>
            {renderInlineMarkdown(bulletMatch[1], baseStyle)}
          </Text>
        </View>,
      );
      i++;
      continue;
    }

    // ── Numbered list (1. item) ──
    const olMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (olMatch) {
      rendered.push(
        <View key={`ol-${i}`} style={styles.listItem}>
          <Text style={[baseStyle, styles.bullet]}>{`${olMatch[1]}.`}</Text>
          <Text style={[baseStyle, styles.listItemText]}>
            {renderInlineMarkdown(olMatch[2], baseStyle)}
          </Text>
        </View>,
      );
      i++;
      continue;
    }

    // ── Empty line = paragraph break ──
    if (line.trim() === '') {
      rendered.push(<View key={`br-${i}`} style={styles.paragraphBreak} />);
      i++;
      continue;
    }

    // ── Regular paragraph line ──
    rendered.push(
      <Text key={`p-${i}`} style={baseStyle}>
        {renderInlineMarkdown(line, baseStyle)}
      </Text>,
    );
    i++;
  }

  return <View>{rendered}</View>;
};

const styles = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: 'monospace',
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 4,
    fontSize: 13,
    color: '#334155',
  },
  codeBlock: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
  },
  codeBlockText: {
    fontFamily: 'monospace',
    fontSize: 12.5,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  h1: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 6,
    color: '#0F172A',
  },
  h2: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
    marginTop: 5,
    color: '#0F172A',
  },
  h3: {
    fontSize: 15.5,
    fontWeight: '700',
    marginBottom: 2,
    marginTop: 4,
    color: '#1E293B',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
    paddingLeft: 4,
  },
  bullet: {
    width: 18,
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  listItemText: {
    flex: 1,
    lineHeight: 22,
  },
  paragraphBreak: {
    height: 8,
  },
});

export default MarkdownText;
