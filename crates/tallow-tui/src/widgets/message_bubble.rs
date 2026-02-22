//! Individual message bubble rendering for Tallow TUI
//!
//! Provides styled message bubbles with:
//! - Directional alignment (sent vs received)
//! - Rounded-ish borders using Unicode box characters
//! - Timestamp and status indicators
//! - Color coding based on message type

use ratatui::{
    buffer::Buffer,
    layout::{HorizontalAlignment, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Widget, Wrap},
};

use super::chat_view::MessageStatus;

/// Individual message bubble widget
#[derive(Debug, Clone)]
pub struct MessageBubble<'a> {
    /// Message text content
    text: &'a str,
    /// Whether this is the user's own message
    is_mine: bool,
    /// Timestamp string (pre-formatted)
    timestamp_str: &'a str,
    /// Message delivery status
    status: MessageStatus,
    /// Sender name (for received messages)
    sender: Option<&'a str>,
    /// Maximum width as percentage of available space
    max_width_pct: u16,
    /// Style overrides
    style: Option<Style>,
}

impl<'a> MessageBubble<'a> {
    /// Create a new message bubble for a sent message
    pub fn sent(text: &'a str, timestamp: &'a str, status: MessageStatus) -> Self {
        Self {
            text,
            is_mine: true,
            timestamp_str: timestamp,
            status,
            sender: None,
            max_width_pct: 75,
            style: None,
        }
    }

    /// Create a new message bubble for a received message
    pub fn received(text: &'a str, sender: &'a str, timestamp: &'a str) -> Self {
        Self {
            text,
            is_mine: false,
            timestamp_str: timestamp,
            status: MessageStatus::Delivered,
            sender: Some(sender),
            max_width_pct: 75,
            style: None,
        }
    }

    /// Create a system message bubble
    pub fn system(text: &'a str) -> Self {
        Self {
            text,
            is_mine: false,
            timestamp_str: "",
            status: MessageStatus::Delivered,
            sender: None,
            max_width_pct: 100,
            style: Some(
                Style::default()
                    .fg(Color::DarkGray)
                    .add_modifier(Modifier::ITALIC),
            ),
        }
    }

    /// Set maximum width percentage (0-100)
    pub fn max_width_pct(mut self, pct: u16) -> Self {
        self.max_width_pct = pct.min(100);
        self
    }

    /// Set custom style
    pub fn style(mut self, style: Style) -> Self {
        self.style = Some(style);
        self
    }

    /// Get the bubble style based on message type
    fn bubble_style(&self) -> Style {
        if let Some(style) = self.style {
            return style;
        }

        if self.is_mine {
            Style::default()
                .fg(Color::White)
                .bg(Color::Rgb(30, 60, 100)) // Blue accent for sent messages
        } else {
            Style::default().fg(Color::White).bg(Color::Rgb(40, 40, 40)) // Neutral gray for received
        }
    }

    /// Get the border style
    fn border_style(&self) -> Style {
        if self.is_mine {
            Style::default().fg(Color::Blue)
        } else if self.sender.is_some() {
            Style::default().fg(Color::Gray)
        } else {
            Style::default().fg(Color::DarkGray) // System messages
        }
    }

    /// Build the content lines
    fn build_content(&self, width: u16) -> Vec<Line<'a>> {
        let mut lines = Vec::new();

        // System messages: just centered text
        if self.sender.is_none() && !self.is_mine {
            lines.push(Line::from(Span::styled(
                self.text,
                self.style.unwrap_or_else(|| {
                    Style::default()
                        .fg(Color::DarkGray)
                        .add_modifier(Modifier::ITALIC)
                }),
            )));
            return lines;
        }

        // Header line: sender/timestamp
        if let Some(sender) = self.sender {
            // Received message header
            lines.push(Line::from(vec![
                Span::styled(
                    sender,
                    Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::raw(" "),
                Span::styled(self.timestamp_str, Style::default().fg(Color::DarkGray)),
            ]));
        } else if self.is_mine {
            // Sent message header (timestamp + status)
            lines.push(Line::from(vec![
                Span::styled(self.timestamp_str, Style::default().fg(Color::DarkGray)),
                Span::raw(" "),
                Span::styled(
                    self.status.indicator(),
                    Style::default().fg(self.status.color()),
                ),
            ]));
        }

        // Message content
        // Simple word wrapping (in production, use textwrap or similar)
        let content_width = width.saturating_sub(4) as usize; // Account for borders
        let mut current_line = String::new();

        for word in self.text.split_whitespace() {
            if current_line.is_empty() {
                current_line = word.to_string();
            } else if current_line.len() + 1 + word.len() <= content_width {
                current_line.push(' ');
                current_line.push_str(word);
            } else {
                lines.push(Line::from(Span::styled(
                    current_line.clone(),
                    Style::default().fg(Color::White),
                )));
                current_line = word.to_string();
            }
        }

        if !current_line.is_empty() {
            lines.push(Line::from(Span::styled(
                current_line,
                Style::default().fg(Color::White),
            )));
        }

        lines
    }
}

impl<'a> Widget for MessageBubble<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.width < 10 || area.height < 2 {
            return;
        }

        // Calculate bubble width
        let bubble_width = (area.width * self.max_width_pct / 100).max(10);

        // System messages: centered, no bubble
        if self.sender.is_none() && !self.is_mine {
            let para = Paragraph::new(self.text)
                .style(self.style.unwrap_or_else(|| {
                    Style::default()
                        .fg(Color::DarkGray)
                        .add_modifier(Modifier::ITALIC)
                }))
                .alignment(HorizontalAlignment::Center);

            para.render(area, buf);
            return;
        }

        // Calculate bubble position
        let x_offset = if self.is_mine {
            area.width.saturating_sub(bubble_width)
        } else {
            0
        };

        let bubble_area = Rect {
            x: area.x + x_offset,
            y: area.y,
            width: bubble_width,
            height: area.height,
        };

        // Build content
        let content = self.build_content(bubble_width);

        // Create block with rounded-ish corners using box drawing characters
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(self.border_style())
            .style(self.bubble_style());

        let paragraph = Paragraph::new(content)
            .block(block)
            .wrap(Wrap { trim: false });

        paragraph.render(bubble_area, buf);
    }
}

/// Helper function to render a conversation of bubbles
pub fn render_conversation<'a>(
    messages: &[(MessageBubble<'a>, u16)], // (bubble, height)
    area: Rect,
    buf: &mut Buffer,
) {
    let mut y_offset = 0u16;

    for (bubble, height) in messages {
        if y_offset >= area.height {
            break;
        }

        let msg_area = Rect {
            x: area.x,
            y: area.y + y_offset,
            width: area.width,
            height: (*height).min(area.height - y_offset),
        };

        bubble.clone().render(msg_area, buf);

        y_offset += height;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sent_bubble() {
        let bubble = MessageBubble::sent("Hello!", "14:30", MessageStatus::Sent);
        assert!(bubble.is_mine);
        assert_eq!(bubble.text, "Hello!");
        assert_eq!(bubble.timestamp_str, "14:30");
    }

    #[test]
    fn test_received_bubble() {
        let bubble = MessageBubble::received("Hi there!", "Alice", "14:31");
        assert!(!bubble.is_mine);
        assert_eq!(bubble.text, "Hi there!");
        assert_eq!(bubble.sender, Some("Alice"));
    }

    #[test]
    fn test_system_bubble() {
        let bubble = MessageBubble::system("User joined");
        assert!(!bubble.is_mine);
        assert_eq!(bubble.sender, None);
        assert!(bubble.style.is_some());
    }

    #[test]
    fn test_max_width() {
        let bubble = MessageBubble::sent("Test", "12:00", MessageStatus::Sent).max_width_pct(50);
        assert_eq!(bubble.max_width_pct, 50);

        let bubble = MessageBubble::sent("Test", "12:00", MessageStatus::Sent).max_width_pct(150); // Clamped to 100
        assert_eq!(bubble.max_width_pct, 100);
    }
}
