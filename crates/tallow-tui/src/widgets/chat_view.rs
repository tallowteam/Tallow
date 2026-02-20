//! Chat message display widget for Tallow TUI
//!
//! Provides a scrollable chat view with support for:
//! - Sent/received message alignment
//! - System messages (centered)
//! - Timestamps and delivery status indicators
//! - Automatic scroll management

use ratatui::{
    buffer::Buffer,
    layout::{Alignment, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, StatefulWidget, Widget, Wrap},
};
use std::time::{SystemTime, UNIX_EPOCH};

/// Message delivery status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MessageStatus {
    /// Message is being sent
    Sending,
    /// Message sent successfully
    Sent,
    /// Message delivered to recipient
    Delivered,
    /// Message read by recipient
    Read,
}

impl MessageStatus {
    /// Returns the status indicator string
    pub fn indicator(&self) -> &'static str {
        match self {
            MessageStatus::Sending => "⋯",
            MessageStatus::Sent => "✓",
            MessageStatus::Delivered => "✓✓",
            MessageStatus::Read => "✓✓",
        }
    }

    /// Returns the color for this status
    pub fn color(&self) -> Color {
        match self {
            MessageStatus::Sending => Color::DarkGray,
            MessageStatus::Sent => Color::Gray,
            MessageStatus::Delivered => Color::Blue,
            MessageStatus::Read => Color::Blue,
        }
    }
}

/// A single chat message
#[derive(Debug, Clone)]
pub struct ChatMessage {
    /// Sender display name
    pub sender: String,
    /// Message content
    pub content: String,
    /// Unix timestamp (seconds since epoch)
    pub timestamp: u64,
    /// True if this message was sent by the current user
    pub is_mine: bool,
    /// True if this is a system message (e.g., "User joined")
    pub is_system: bool,
    /// Delivery status (only relevant for sent messages)
    pub status: MessageStatus,
}

impl ChatMessage {
    /// Create a new chat message
    pub fn new(sender: impl Into<String>, content: impl Into<String>, is_mine: bool) -> Self {
        Self {
            sender: sender.into(),
            content: content.into(),
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            is_mine,
            is_system: false,
            status: if is_mine {
                MessageStatus::Sending
            } else {
                MessageStatus::Delivered
            },
        }
    }

    /// Create a system message
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            sender: String::from("System"),
            content: content.into(),
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            is_mine: false,
            is_system: true,
            status: MessageStatus::Delivered,
        }
    }

    /// Format timestamp as HH:MM
    pub fn format_time(&self) -> String {
        let dt = chrono::DateTime::from_timestamp(self.timestamp as i64, 0)
            .unwrap_or(chrono::DateTime::UNIX_EPOCH);
        dt.format("%H:%M").to_string()
    }
}

/// Chat view state for scrolling
#[derive(Debug, Default)]
pub struct ChatViewState {
    /// Current scroll offset (0 = bottom, higher = scrolled up)
    pub scroll_offset: u16,
    /// Whether auto-scroll to bottom is enabled
    pub auto_scroll: bool,
}

impl ChatViewState {
    /// Create a new chat view state with auto-scroll enabled
    pub fn new() -> Self {
        Self {
            scroll_offset: 0,
            auto_scroll: true,
        }
    }

    /// Scroll up by the given amount
    pub fn scroll_up(&mut self, amount: u16) {
        self.scroll_offset = self.scroll_offset.saturating_add(amount);
        self.auto_scroll = false;
    }

    /// Scroll down by the given amount
    pub fn scroll_down(&mut self, amount: u16) {
        self.scroll_offset = self.scroll_offset.saturating_sub(amount);
        if self.scroll_offset == 0 {
            self.auto_scroll = true;
        }
    }

    /// Reset scroll to bottom
    pub fn scroll_to_bottom(&mut self) {
        self.scroll_offset = 0;
        self.auto_scroll = true;
    }
}

/// Scrollable chat message display widget
pub struct ChatView<'a> {
    /// Messages to display
    messages: &'a [ChatMessage],
    /// Block around the widget
    block: Option<Block<'a>>,
    /// Style for the widget
    style: Style,
    /// Maximum width for message bubbles (percentage of available width)
    max_bubble_width: u16,
}

impl<'a> ChatView<'a> {
    /// Create a new chat view
    pub fn new(messages: &'a [ChatMessage]) -> Self {
        Self {
            messages,
            block: None,
            style: Style::default(),
            max_bubble_width: 75, // 75% of width
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

    /// Set maximum bubble width percentage (0-100)
    pub fn max_bubble_width(mut self, width: u16) -> Self {
        self.max_bubble_width = width.min(100);
        self
    }

    /// Calculate the number of lines a message will occupy
    fn message_height(&self, msg: &ChatMessage, width: u16) -> u16 {
        let bubble_width = (width * self.max_bubble_width / 100).max(20);
        let content_width = bubble_width.saturating_sub(4); // Account for borders and padding

        // Line for sender + timestamp
        let mut lines = if msg.is_system { 0 } else { 1 };

        // Content lines (wrapped)
        let content_lines = (msg.content.len() as u16).div_ceil(content_width);
        lines += content_lines.max(1);

        // Status line for own messages
        if msg.is_mine && !msg.is_system {
            lines += 1;
        }

        // Add spacing
        lines + 1
    }
}

impl<'a> StatefulWidget for ChatView<'a> {
    type State = ChatViewState;

    fn render(mut self, area: Rect, buf: &mut Buffer, state: &mut Self::State) {
        let area = match self.block.take() {
            Some(block) => {
                let inner = block.inner(area);
                block.render(area, buf);
                inner
            }
            None => area,
        };

        if area.width < 10 || area.height < 3 {
            return;
        }

        // Calculate total content height
        let total_lines: u16 = self
            .messages
            .iter()
            .map(|msg| self.message_height(msg, area.width))
            .sum();

        // Determine which messages to render based on scroll
        let visible_height = area.height;
        let scroll = if state.auto_scroll {
            total_lines.saturating_sub(visible_height)
        } else {
            state
                .scroll_offset
                .min(total_lines.saturating_sub(visible_height))
        };

        let mut current_line = 0u16;
        let start_line = scroll;
        let end_line = scroll + visible_height;

        for msg in self.messages {
            let msg_height = self.message_height(msg, area.width);
            let msg_start = current_line;
            let msg_end = current_line + msg_height;

            // Only render if visible in viewport
            if msg_end > start_line && msg_start < end_line {
                let y_offset = msg_start.saturating_sub(start_line);

                if y_offset < visible_height {
                    self.render_message(msg, area, buf, y_offset);
                }
            }

            current_line = msg_end;

            if current_line >= end_line {
                break;
            }
        }
    }
}

impl<'a> ChatView<'a> {
    /// Render a single message
    fn render_message(&self, msg: &ChatMessage, area: Rect, buf: &mut Buffer, y_offset: u16) {
        let bubble_width = (area.width * self.max_bubble_width / 100).max(20);

        if msg.is_system {
            // System messages: centered, gray
            let content = Span::styled(
                &msg.content,
                Style::default()
                    .fg(Color::DarkGray)
                    .add_modifier(Modifier::ITALIC),
            );

            let para = Paragraph::new(Line::from(content)).alignment(Alignment::Center);

            let msg_area = Rect {
                x: area.x,
                y: area.y + y_offset,
                width: area.width,
                height: 1,
            };

            para.render(msg_area, buf);
        } else if msg.is_mine {
            // Own messages: right-aligned, blue accent
            let x_offset = area.width.saturating_sub(bubble_width);
            let msg_area = Rect {
                x: area.x + x_offset,
                y: area.y + y_offset,
                width: bubble_width,
                height: 3,
            };

            let time = msg.format_time();
            let status = msg.status.indicator();

            let header = Line::from(vec![
                Span::styled(format!("{} ", time), Style::default().fg(Color::DarkGray)),
                Span::styled(status, Style::default().fg(msg.status.color())),
            ]);

            let content = Line::from(Span::styled(
                &msg.content,
                Style::default().fg(Color::White),
            ));

            let para = Paragraph::new(vec![header, content])
                .block(
                    Block::default()
                        .borders(Borders::ALL)
                        .style(Style::default().fg(Color::Blue).bg(Color::Rgb(20, 30, 50))),
                )
                .wrap(Wrap { trim: false });

            para.render(msg_area, buf);
        } else {
            // Received messages: left-aligned, neutral
            let msg_area = Rect {
                x: area.x,
                y: area.y + y_offset,
                width: bubble_width,
                height: 3,
            };

            let header = Line::from(vec![
                Span::styled(&msg.sender, Style::default().fg(Color::Cyan)),
                Span::styled(
                    format!(" {}", msg.format_time()),
                    Style::default().fg(Color::DarkGray),
                ),
            ]);

            let content = Line::from(Span::styled(
                &msg.content,
                Style::default().fg(Color::White),
            ));

            let para = Paragraph::new(vec![header, content])
                .block(
                    Block::default()
                        .borders(Borders::ALL)
                        .style(Style::default().fg(Color::Gray).bg(Color::Rgb(30, 30, 30))),
                )
                .wrap(Wrap { trim: false });

            para.render(msg_area, buf);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_creation() {
        let msg = ChatMessage::new("Alice", "Hello!", true);
        assert_eq!(msg.sender, "Alice");
        assert_eq!(msg.content, "Hello!");
        assert!(msg.is_mine);
        assert!(!msg.is_system);
    }

    #[test]
    fn test_system_message() {
        let msg = ChatMessage::system("User joined");
        assert!(msg.is_system);
        assert_eq!(msg.content, "User joined");
    }

    #[test]
    fn test_scroll_state() {
        let mut state = ChatViewState::new();
        assert!(state.auto_scroll);
        assert_eq!(state.scroll_offset, 0);

        state.scroll_up(5);
        assert_eq!(state.scroll_offset, 5);
        assert!(!state.auto_scroll);

        state.scroll_down(5);
        assert_eq!(state.scroll_offset, 0);
        assert!(state.auto_scroll);
    }
}
