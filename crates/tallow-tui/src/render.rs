//! Rendering logic using ratatui

use crate::app::{App, FocusedPanel};
use crate::panels;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::Frame;

/// Render the TUI dashboard
pub fn render(frame: &mut Frame, app: &App) {
    match app.mode {
        crate::modes::TuiMode::Dashboard => render_dashboard(frame, app),
        crate::modes::TuiMode::Minimal => render_minimal(frame, app),
        crate::modes::TuiMode::Zen => render_zen(frame, app),
        crate::modes::TuiMode::Monitor => render_monitor(frame, app),
    }

    // Show help overlay if active
    if app.show_help {
        render_help_overlay(frame);
    }
}

/// Full dashboard layout: status | transfers | devices + hotkey bar
fn render_dashboard(frame: &mut Frame, app: &App) {
    let outer = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(0),    // Main area
            Constraint::Length(1), // Hotkey bar
        ])
        .split(frame.area());

    let main_area = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(30), // Status panel
            Constraint::Percentage(40), // Transfers panel
            Constraint::Percentage(30), // Devices panel
        ])
        .split(outer[0]);

    panels::status::render(frame, main_area[0], app);
    panels::transfers::render(frame, main_area[1], app);
    panels::devices::render(frame, main_area[2], app);
    panels::hotkey_bar::render(frame, outer[1], app);
}

/// Minimal layout: transfers only
fn render_minimal(frame: &mut Frame, app: &App) {
    panels::transfers::render(frame, frame.area(), app);
}

/// Zen mode: focused transfer view
fn render_zen(frame: &mut Frame, app: &App) {
    let area = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(1)])
        .split(frame.area());

    panels::transfers::render(frame, area[0], app);
    panels::hotkey_bar::render(frame, area[1], app);
}

/// Monitor mode: read-only status + transfers
fn render_monitor(frame: &mut Frame, app: &App) {
    let area = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(5), // Status bar
            Constraint::Min(0),   // Transfers
        ])
        .split(frame.area());

    panels::status::render(frame, area[0], app);
    panels::transfers::render(frame, area[1], app);
}

/// Render help overlay in the center of the screen
fn render_help_overlay(frame: &mut Frame) {
    let area = centered_rect(60, 80, frame.area());

    let help_text = vec![
        Line::from(Span::styled(
            " Tallow TUI — Keyboard Shortcuts ",
            Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from(vec![
            Span::styled("  q / Ctrl+C  ", Style::default().fg(Color::Yellow)),
            Span::raw("Quit"),
        ]),
        Line::from(vec![
            Span::styled("  Tab         ", Style::default().fg(Color::Yellow)),
            Span::raw("Switch panel focus"),
        ]),
        Line::from(vec![
            Span::styled("  ?           ", Style::default().fg(Color::Yellow)),
            Span::raw("Toggle this help"),
        ]),
        Line::from(vec![
            Span::styled("  1           ", Style::default().fg(Color::Yellow)),
            Span::raw("Dashboard mode"),
        ]),
        Line::from(vec![
            Span::styled("  2           ", Style::default().fg(Color::Yellow)),
            Span::raw("Minimal mode"),
        ]),
        Line::from(vec![
            Span::styled("  3           ", Style::default().fg(Color::Yellow)),
            Span::raw("Zen mode"),
        ]),
        Line::from(vec![
            Span::styled("  4           ", Style::default().fg(Color::Yellow)),
            Span::raw("Monitor mode"),
        ]),
        Line::from(vec![
            Span::styled("  r           ", Style::default().fg(Color::Yellow)),
            Span::raw("Refresh"),
        ]),
        Line::from(""),
        Line::from(Span::styled(
            "  Press ? to close  ",
            Style::default().fg(Color::DarkGray),
        )),
    ];

    let help = Paragraph::new(help_text)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::Cyan))
                .title(" Help "),
        );

    // Clear the area first
    frame.render_widget(ratatui::widgets::Clear, area);
    frame.render_widget(help, area);
}

/// Helper to create a centered rect
fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
    let popup_layout = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage((100 - percent_y) / 2),
            Constraint::Percentage(percent_y),
            Constraint::Percentage((100 - percent_y) / 2),
        ])
        .split(r);

    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage((100 - percent_x) / 2),
            Constraint::Percentage(percent_x),
            Constraint::Percentage((100 - percent_x) / 2),
        ])
        .split(popup_layout[1])[1]
}
