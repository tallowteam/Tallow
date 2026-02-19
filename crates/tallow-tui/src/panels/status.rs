//! Status panel — shows connection state, relay, room code, throughput

use crate::app::{App, FocusedPanel};
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::Frame;

/// Render the status panel
pub fn render(frame: &mut Frame, area: Rect, app: &App) {
    let is_focused = app.focused_panel == FocusedPanel::Status;

    let border_color = if is_focused {
        Color::Cyan
    } else {
        Color::DarkGray
    };

    let connection_indicator = if app.connected {
        Span::styled(" Connected ", Style::default().fg(Color::Green))
    } else {
        Span::styled(" Disconnected ", Style::default().fg(Color::Red))
    };

    let relay_line = match &app.relay_addr {
        Some(addr) => Line::from(vec![
            Span::styled("  Relay: ", Style::default().fg(Color::Yellow)),
            Span::raw(addr.as_str()),
        ]),
        None => Line::from(Span::styled(
            "  Relay: none",
            Style::default().fg(Color::DarkGray),
        )),
    };

    let room_line = match &app.room_code {
        Some(code) => Line::from(vec![
            Span::styled("  Room:  ", Style::default().fg(Color::Yellow)),
            Span::styled(
                code.as_str(),
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            ),
        ]),
        None => Line::from(Span::styled(
            "  Room:  --",
            Style::default().fg(Color::DarkGray),
        )),
    };

    let sent_line = Line::from(vec![
        Span::styled("  Sent:  ", Style::default().fg(Color::Yellow)),
        Span::raw(App::format_bytes(app.bytes_sent)),
    ]);

    let recv_line = Line::from(vec![
        Span::styled("  Recv:  ", Style::default().fg(Color::Yellow)),
        Span::raw(App::format_bytes(app.bytes_received)),
    ]);

    let status_line = Line::from(vec![
        Span::styled("  ", Style::default()),
        Span::styled(
            app.status_message.as_str(),
            Style::default().fg(Color::White),
        ),
    ]);

    let lines = vec![
        Line::from(connection_indicator),
        Line::from(""),
        relay_line,
        room_line,
        Line::from(""),
        sent_line,
        recv_line,
        Line::from(""),
        status_line,
    ];

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(Style::default().fg(border_color))
        .title(" Status ");

    let paragraph = Paragraph::new(lines).block(block);
    frame.render_widget(paragraph, area);
}
