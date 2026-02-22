//! Rendering logic using ratatui

use crate::app::{App, Overlay};
use crate::panels;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, BorderType, Borders, Paragraph};
use ratatui::Frame;

/// Render the TUI dashboard
pub fn render(frame: &mut Frame, app: &App) {
    // 1. Check minimum terminal size
    let area = frame.area();
    if area.width < 60 || area.height < 16 {
        render_size_warning(frame);
        return;
    }

    // 2. Render base layout by mode
    match app.mode {
        crate::modes::TuiMode::Dashboard => render_dashboard(frame, app),
        crate::modes::TuiMode::Minimal => render_minimal(frame, app),
        crate::modes::TuiMode::Zen => render_zen(frame, app),
        crate::modes::TuiMode::Monitor => render_monitor(frame, app),
    }

    // 3. Render overlay stack (bottom to top)
    for overlay in &app.overlays {
        let overlay_area = centered_rect(60, 70, frame.area());
        frame.render_widget(ratatui::widgets::Clear, overlay_area);
        match overlay {
            Overlay::Help => render_help_overlay_in(frame, overlay_area),
            Overlay::IdentityDetail => render_identity_overlay(frame, overlay_area, app),
            Overlay::TransferConfirm { filename, size } => {
                render_confirm_overlay(frame, overlay_area, filename, *size);
            }
        }
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
            Constraint::Min(0),    // Transfers
        ])
        .split(frame.area());

    panels::status::render(frame, area[0], app);
    panels::transfers::render(frame, area[1], app);
}

/// Render help overlay in a given area
fn render_help_overlay_in(frame: &mut Frame, area: Rect) {
    let help_text = vec![
        Line::from(Span::styled(
            " Tallow TUI — Keyboard Shortcuts ",
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
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
            Span::styled("  i           ", Style::default().fg(Color::Yellow)),
            Span::raw("Identity details"),
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
            "  Press Esc or ? to close  ",
            Style::default().fg(Color::DarkGray),
        )),
    ];

    let help = Paragraph::new(help_text).block(
        Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Cyan))
            .title(" Help "),
    );

    frame.render_widget(help, area);
}

/// Render identity detail overlay
fn render_identity_overlay(frame: &mut Frame, area: Rect, app: &App) {
    let fingerprint_text = match &app.identity_fingerprint {
        Some(fp) => fp.clone(),
        None => "No identity loaded".to_string(),
    };

    let lines = vec![
        Line::from(Span::styled(
            " Identity Details ",
            Style::default()
                .fg(Color::Magenta)
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from(vec![
            Span::styled("  Fingerprint: ", Style::default().fg(Color::Yellow)),
            Span::styled(
                fingerprint_text,
                Style::default()
                    .fg(Color::White)
                    .add_modifier(Modifier::BOLD),
            ),
        ]),
        Line::from(""),
        Line::from(Span::styled(
            "  This is your cryptographic identity.",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(Span::styled(
            "  Share the fingerprint for verification.",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(""),
        Line::from(Span::styled(
            "  Press Esc to close  ",
            Style::default().fg(Color::DarkGray),
        )),
    ];

    let block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta))
        .title(" Identity ");

    let paragraph = Paragraph::new(lines).block(block);
    frame.render_widget(paragraph, area);
}

/// Render transfer confirmation overlay
fn render_confirm_overlay(frame: &mut Frame, area: Rect, filename: &str, size: u64) {
    let size_display = crate::app::App::format_bytes(size);

    let lines = vec![
        Line::from(Span::styled(
            " Incoming Transfer ",
            Style::default()
                .fg(Color::Yellow)
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from(vec![
            Span::styled("  File: ", Style::default().fg(Color::Yellow)),
            Span::styled(
                filename,
                Style::default()
                    .fg(Color::White)
                    .add_modifier(Modifier::BOLD),
            ),
        ]),
        Line::from(vec![
            Span::styled("  Size: ", Style::default().fg(Color::Yellow)),
            Span::raw(size_display),
        ]),
        Line::from(""),
        Line::from(Span::styled(
            "  Accept? [y/n]",
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )),
    ];

    let block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Yellow))
        .title(" Confirm ");

    let paragraph = Paragraph::new(lines).block(block);
    frame.render_widget(paragraph, area);
}

/// Render a warning when the terminal is too small
fn render_size_warning(frame: &mut Frame) {
    let area = frame.area();
    let lines = vec![
        Line::from(""),
        Line::from(Span::styled(
            "Terminal too small",
            Style::default().fg(Color::Red).add_modifier(Modifier::BOLD),
        )),
        Line::from(format!(
            "Need 60x16 minimum, current: {}x{}",
            area.width, area.height
        )),
        Line::from(""),
        Line::from(Span::styled(
            "Please resize your terminal.",
            Style::default().fg(Color::DarkGray),
        )),
    ];

    let paragraph = Paragraph::new(lines)
        .alignment(ratatui::layout::HorizontalAlignment::Center)
        .block(Block::default());
    frame.render_widget(paragraph, area);
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app::{App, Overlay, TransferDirection, TransferInfo};
    use crate::modes::TuiMode;
    use ratatui::backend::TestBackend;
    use ratatui::Terminal;

    /// Convert buffer contents to a string for assertion matching
    fn buffer_to_string(buf: &ratatui::buffer::Buffer) -> String {
        let mut s = String::new();
        for y in 0..buf.area.height {
            for x in 0..buf.area.width {
                s.push_str(buf[(x, y)].symbol());
            }
            s.push('\n');
        }
        s
    }

    #[test]
    fn test_dashboard_renders_without_panic() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let app = App::new();

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();
    }

    #[test]
    fn test_dashboard_with_identity() {
        // Use wider terminal so the status panel (30%) has enough columns
        // for the fingerprint display (9-char prefix + 16-char hash + "...")
        let backend = TestBackend::new(120, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let mut app = App::new();
        app.identity_fingerprint = Some("ABCD1234DEADBEEF5678".to_string());

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();

        let buf_str = buffer_to_string(terminal.backend().buffer());
        // Status panel truncates to first 16 chars of fingerprint
        assert!(
            buf_str.contains("ABCD1234"),
            "Expected fingerprint prefix in buffer, got: {}",
            buf_str,
        );
    }

    #[test]
    fn test_dashboard_with_active_transfer() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let mut app = App::new();
        app.transfers.push(TransferInfo {
            filename: "hello_world.txt".to_string(),
            progress: 0.5,
            speed_bps: 1_000_000,
            direction: TransferDirection::Send,
            status: "Transferring".to_string(),
        });

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();

        let buf_str = buffer_to_string(terminal.backend().buffer());
        assert!(buf_str.contains("hello_world.txt"));
    }

    #[test]
    fn test_minimal_renders_without_panic() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let mut app = App::new();
        app.mode = TuiMode::Minimal;

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();
    }

    #[test]
    fn test_zen_renders_without_panic() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let mut app = App::new();
        app.mode = TuiMode::Zen;

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();
    }

    #[test]
    fn test_monitor_renders_without_panic() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let mut app = App::new();
        app.mode = TuiMode::Monitor;

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();
    }

    #[test]
    fn test_small_terminal_shows_warning() {
        let backend = TestBackend::new(40, 10);
        let mut terminal = Terminal::new(backend).unwrap();
        let app = App::new();

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();

        let buf_str = buffer_to_string(terminal.backend().buffer());
        assert!(buf_str.contains("too small"));
    }

    #[test]
    fn test_help_overlay_renders() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let mut app = App::new();
        app.push_overlay(Overlay::Help);

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();

        let buf_str = buffer_to_string(terminal.backend().buffer());
        assert!(buf_str.contains("Help"));
        assert!(buf_str.contains("Quit"));
    }

    #[test]
    fn test_identity_overlay_renders() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let mut app = App::new();
        app.identity_fingerprint = Some("DEADBEEF12345678AABB".to_string());
        app.push_overlay(Overlay::IdentityDetail);

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();

        let buf_str = buffer_to_string(terminal.backend().buffer());
        assert!(buf_str.contains("Identity"));
        assert!(buf_str.contains("DEADBEEF"));
    }

    #[test]
    fn test_confirm_overlay_renders() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        let mut app = App::new();
        app.push_overlay(Overlay::TransferConfirm {
            filename: "secret.zip".to_string(),
            size: 1_048_576,
        });

        terminal
            .draw(|frame| {
                render(frame, &app);
            })
            .unwrap();

        let buf_str = buffer_to_string(terminal.backend().buffer());
        assert!(buf_str.contains("secret.zip"));
        assert!(buf_str.contains("[y/n]"));
    }

    #[test]
    fn test_large_terminal_no_panic() {
        let backend = TestBackend::new(300, 80);
        let mut terminal = Terminal::new(backend).unwrap();

        for mode in &[
            TuiMode::Dashboard,
            TuiMode::Minimal,
            TuiMode::Zen,
            TuiMode::Monitor,
        ] {
            let mut app = App::new();
            app.mode = *mode;

            terminal
                .draw(|frame| {
                    render(frame, &app);
                })
                .unwrap();
        }
    }
}
