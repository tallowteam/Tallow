//! Hotkey bar panel — single-line bar at bottom showing key bindings

use crate::app::App;
use ratatui::layout::Rect;
use ratatui::style::{Color, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Paragraph;
use ratatui::Frame;

/// Render the hotkey bar
pub fn render(frame: &mut Frame, area: Rect, _app: &App) {
    let bar = Line::from(vec![
        Span::styled(" q", Style::default().fg(Color::Yellow)),
        Span::styled(" Quit ", Style::default().fg(Color::DarkGray)),
        Span::styled("Tab", Style::default().fg(Color::Yellow)),
        Span::styled(" Panel ", Style::default().fg(Color::DarkGray)),
        Span::styled("?", Style::default().fg(Color::Yellow)),
        Span::styled(" Help ", Style::default().fg(Color::DarkGray)),
        Span::styled("i", Style::default().fg(Color::Yellow)),
        Span::styled(" Identity ", Style::default().fg(Color::DarkGray)),
        Span::styled("1-4", Style::default().fg(Color::Yellow)),
        Span::styled(" Mode ", Style::default().fg(Color::DarkGray)),
        Span::styled("r", Style::default().fg(Color::Yellow)),
        Span::styled(" Refresh ", Style::default().fg(Color::DarkGray)),
    ]);

    let paragraph = Paragraph::new(bar);
    frame.render_widget(paragraph, area);
}
