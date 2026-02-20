//! Multi-line chat input widget for Tallow TUI
//!
//! Provides a text input area with:
//! - Cursor positioning and movement
//! - Character insertion and deletion
//! - Focus state visualization
//! - Placeholder text support

use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, StatefulWidget, Widget},
};

/// Multi-line text input state
#[derive(Debug, Clone, Default)]
pub struct ChatInputState {
    /// Current text content
    pub text: String,
    /// Cursor position (byte offset, not character offset)
    pub cursor_pos: usize,
    /// Whether the input is focused
    pub is_focused: bool,
}

impl ChatInputState {
    /// Create a new empty input state
    pub fn new() -> Self {
        Self {
            text: String::new(),
            cursor_pos: 0,
            is_focused: false,
        }
    }

    /// Insert a character at the cursor position
    pub fn insert_char(&mut self, c: char) {
        // Ensure cursor is within bounds
        let cursor = self.cursor_pos.min(self.text.len());
        self.text.insert(cursor, c);
        self.cursor_pos = cursor + c.len_utf8();
    }

    /// Delete the character before the cursor (backspace)
    pub fn delete_char(&mut self) {
        if self.cursor_pos > 0 && !self.text.is_empty() {
            let mut cursor = self.cursor_pos;
            // Find the previous character boundary
            while cursor > 0 {
                cursor -= 1;
                if self.text.is_char_boundary(cursor) {
                    break;
                }
            }
            self.text.remove(cursor);
            self.cursor_pos = cursor;
        }
    }

    /// Delete the character at the cursor (delete key)
    pub fn delete_char_forward(&mut self) {
        if self.cursor_pos < self.text.len() {
            let cursor = self.cursor_pos;
            if self.text.is_char_boundary(cursor) {
                self.text.remove(cursor);
            }
        }
    }

    /// Move cursor left by one character
    pub fn move_cursor_left(&mut self) {
        if self.cursor_pos > 0 {
            let mut cursor = self.cursor_pos;
            // Move to previous character boundary
            while cursor > 0 {
                cursor -= 1;
                if self.text.is_char_boundary(cursor) {
                    break;
                }
            }
            self.cursor_pos = cursor;
        }
    }

    /// Move cursor right by one character
    pub fn move_cursor_right(&mut self) {
        if self.cursor_pos < self.text.len() {
            let mut cursor = self.cursor_pos + 1;
            // Move to next character boundary
            while cursor < self.text.len() && !self.text.is_char_boundary(cursor) {
                cursor += 1;
            }
            self.cursor_pos = cursor;
        }
    }

    /// Move cursor to the beginning of the line
    pub fn move_cursor_to_start(&mut self) {
        self.cursor_pos = 0;
    }

    /// Move cursor to the end of the line
    pub fn move_cursor_to_end(&mut self) {
        self.cursor_pos = self.text.len();
    }

    /// Clear all text and reset cursor
    pub fn clear(&mut self) {
        self.text.clear();
        self.cursor_pos = 0;
    }

    /// Get the current text
    pub fn text(&self) -> &str {
        &self.text
    }

    /// Get the current text and clear the input (for sending)
    pub fn take_text(&mut self) -> String {
        let text = self.text.clone();
        self.clear();
        text
    }

    /// Set focus state
    pub fn set_focused(&mut self, focused: bool) {
        self.is_focused = focused;
    }

    /// Toggle focus state
    pub fn toggle_focus(&mut self) {
        self.is_focused = !self.is_focused;
    }

    /// Check if input is empty
    pub fn is_empty(&self) -> bool {
        self.text.is_empty()
    }

    /// Get character position (not byte position)
    pub fn char_pos(&self) -> usize {
        self.text[..self.cursor_pos].chars().count()
    }
}

/// Multi-line chat input widget
pub struct ChatInput<'a> {
    /// Block around the widget
    block: Option<Block<'a>>,
    /// Style for the widget
    style: Style,
    /// Placeholder text when empty
    placeholder: &'a str,
    /// Style for placeholder text
    placeholder_style: Style,
    /// Style for focused state
    focused_style: Style,
}

impl<'a> ChatInput<'a> {
    /// Create a new chat input widget
    pub fn new() -> Self {
        Self {
            block: None,
            style: Style::default(),
            placeholder: "Type a message...",
            placeholder_style: Style::default()
                .fg(Color::DarkGray)
                .add_modifier(Modifier::ITALIC),
            focused_style: Style::default().fg(Color::Cyan),
        }
    }

    /// Set the block around the widget
    pub fn block(mut self, block: Block<'a>) -> Self {
        self.block = Some(block);
        self
    }

    /// Set the style
    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }

    /// Set placeholder text
    pub fn placeholder(mut self, text: &'a str) -> Self {
        self.placeholder = text;
        self
    }

    /// Set placeholder style
    pub fn placeholder_style(mut self, style: Style) -> Self {
        self.placeholder_style = style;
        self
    }

    /// Set focused border style
    pub fn focused_style(mut self, style: Style) -> Self {
        self.focused_style = style;
        self
    }
}

impl<'a> Default for ChatInput<'a> {
    fn default() -> Self {
        Self::new()
    }
}

impl<'a> StatefulWidget for ChatInput<'a> {
    type State = ChatInputState;

    fn render(mut self, area: Rect, buf: &mut Buffer, state: &mut Self::State) {
        // Apply focused style to block if focused
        let block = if let Some(mut block) = self.block.take() {
            if state.is_focused {
                block = block.border_style(self.focused_style);
            }
            Some(block)
        } else {
            Some(
                Block::default()
                    .borders(Borders::ALL)
                    .border_style(if state.is_focused {
                        self.focused_style
                    } else {
                        Style::default().fg(Color::Gray)
                    }),
            )
        };

        let inner = if let Some(ref b) = block {
            b.inner(area)
        } else {
            area
        };

        // Render block
        if let Some(b) = block {
            b.render(area, buf);
        }

        if inner.width < 2 || inner.height < 1 {
            return;
        }

        // Build the display text with cursor
        let text = if state.text.is_empty() && !state.is_focused {
            // Show placeholder
            Line::from(Span::styled(self.placeholder, self.placeholder_style))
        } else {
            // Show text with cursor
            let before_cursor = &state.text[..state.cursor_pos];
            let after_cursor = &state.text[state.cursor_pos..];

            let cursor_char: String = if state.is_focused {
                if after_cursor.is_empty() {
                    " ".to_string()
                } else {
                    after_cursor
                        .chars()
                        .next()
                        .map(|c| c.to_string())
                        .unwrap_or_else(|| " ".to_string())
                }
            } else {
                String::new()
            };

            let mut spans = vec![Span::styled(
                before_cursor.to_string(),
                self.style.fg(Color::White),
            )];

            if state.is_focused {
                // Add cursor
                spans.push(Span::styled(
                    cursor_char.clone(),
                    Style::default()
                        .fg(Color::Black)
                        .bg(Color::White)
                        .add_modifier(Modifier::BOLD),
                ));

                // Add text after cursor if any
                if !after_cursor.is_empty() && cursor_char != after_cursor {
                    let skip_count = after_cursor
                        .chars()
                        .next()
                        .map(|c| c.len_utf8())
                        .unwrap_or(0);
                    if skip_count < after_cursor.len() {
                        spans.push(Span::styled(
                            after_cursor[skip_count..].to_string(),
                            self.style.fg(Color::White),
                        ));
                    }
                }
            } else if !after_cursor.is_empty() {
                spans.push(Span::styled(
                    after_cursor.to_string(),
                    self.style.fg(Color::White),
                ));
            }

            Line::from(spans)
        };

        let paragraph = Paragraph::new(text).style(self.style);

        paragraph.render(inner, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_input_state_creation() {
        let state = ChatInputState::new();
        assert!(state.text.is_empty());
        assert_eq!(state.cursor_pos, 0);
        assert!(!state.is_focused);
    }

    #[test]
    fn test_insert_char() {
        let mut state = ChatInputState::new();
        state.insert_char('H');
        state.insert_char('i');
        assert_eq!(state.text, "Hi");
        assert_eq!(state.cursor_pos, 2);
    }

    #[test]
    fn test_delete_char() {
        let mut state = ChatInputState::new();
        state.insert_char('H');
        state.insert_char('i');
        state.delete_char();
        assert_eq!(state.text, "H");
        assert_eq!(state.cursor_pos, 1);
    }

    #[test]
    fn test_cursor_movement() {
        let mut state = ChatInputState::new();
        state.insert_char('H');
        state.insert_char('e');
        state.insert_char('l');
        state.insert_char('l');
        state.insert_char('o');

        state.move_cursor_left();
        state.move_cursor_left();
        assert_eq!(state.cursor_pos, 3);

        state.move_cursor_right();
        assert_eq!(state.cursor_pos, 4);

        state.move_cursor_to_start();
        assert_eq!(state.cursor_pos, 0);

        state.move_cursor_to_end();
        assert_eq!(state.cursor_pos, 5);
    }

    #[test]
    fn test_clear() {
        let mut state = ChatInputState::new();
        state.insert_char('T');
        state.insert_char('e');
        state.insert_char('s');
        state.insert_char('t');
        state.clear();
        assert!(state.text.is_empty());
        assert_eq!(state.cursor_pos, 0);
    }

    #[test]
    fn test_take_text() {
        let mut state = ChatInputState::new();
        state.insert_char('H');
        state.insert_char('i');
        let text = state.take_text();
        assert_eq!(text, "Hi");
        assert!(state.text.is_empty());
        assert_eq!(state.cursor_pos, 0);
    }

    #[test]
    fn test_unicode() {
        let mut state = ChatInputState::new();
        state.insert_char('🚀');
        state.insert_char('✓');
        assert_eq!(state.text, "🚀✓");

        state.move_cursor_left();
        assert_eq!(state.char_pos(), 1);

        state.delete_char();
        assert_eq!(state.text, "✓");
    }
}
