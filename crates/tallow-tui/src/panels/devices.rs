//! Devices panel — shows discovered peers on the local network

use crate::app::{App, FocusedPanel};
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::Frame;

/// Render the devices panel
pub fn render(frame: &mut Frame, area: Rect, app: &App) {
    let is_focused = app.focused_panel == FocusedPanel::Devices;

    let border_color = if is_focused {
        Color::Cyan
    } else {
        Color::DarkGray
    };

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(Style::default().fg(border_color))
        .title(format!(" Devices ({}) ", app.peers.len()));

    if app.peers.is_empty() {
        let empty_msg = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  Scanning...",
                Style::default().fg(Color::DarkGray),
            )),
            Line::from(""),
            Line::from(Span::styled(
                "  No peers found on LAN",
                Style::default().fg(Color::DarkGray),
            )),
        ])
        .block(block);

        frame.render_widget(empty_msg, area);
        return;
    }

    let mut lines = Vec::new();
    for peer in &app.peers {
        let trust_icon = if peer.verified {
            Span::styled(" [ok] ", Style::default().fg(Color::Green))
        } else {
            Span::styled(" [??] ", Style::default().fg(Color::Yellow))
        };

        lines.push(Line::from(vec![
            trust_icon,
            Span::styled(
                peer.name.as_str(),
                Style::default().add_modifier(Modifier::BOLD),
            ),
        ]));
        lines.push(Line::from(vec![
            Span::raw("       "),
            Span::styled(peer.address.as_str(), Style::default().fg(Color::DarkGray)),
        ]));
        lines.push(Line::from(""));
    }

    let paragraph = Paragraph::new(lines).block(block);
    frame.render_widget(paragraph, area);
}
