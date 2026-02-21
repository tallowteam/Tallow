//! Transfers panel — shows active file transfers with progress bars

use crate::app::{App, FocusedPanel, TransferDirection};
use crate::widgets::speed_indicator::SpeedIndicatorCompact;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Gauge, Paragraph};
use ratatui::Frame;

/// Render the transfers panel
pub fn render(frame: &mut Frame, area: Rect, app: &App) {
    // Zero-size guard
    if area.width < 10 || area.height < 3 {
        return;
    }

    let is_focused = app.focused_panel == FocusedPanel::Transfers;

    let border_color = if is_focused {
        Color::Cyan
    } else {
        Color::DarkGray
    };

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(Style::default().fg(border_color))
        .title(format!(" Transfers ({}) ", app.transfers.len()));

    if app.transfers.is_empty() {
        let empty_msg = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No active transfers",
                Style::default().fg(Color::DarkGray),
            )),
            Line::from(""),
            Line::from(Span::styled(
                "  Use 'tallow send <file>' to start",
                Style::default().fg(Color::DarkGray),
            )),
        ])
        .block(block);

        frame.render_widget(empty_msg, area);
        return;
    }

    // Split area into rows: 3 lines per transfer
    let inner = block.inner(area);
    frame.render_widget(block, area);

    let constraints: Vec<Constraint> = app
        .transfers
        .iter()
        .map(|_| Constraint::Length(3))
        .chain(std::iter::once(Constraint::Min(0)))
        .collect();

    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints(constraints)
        .split(inner);

    for (i, transfer) in app.transfers.iter().enumerate() {
        if i >= rows.len() - 1 {
            break;
        }
        render_transfer_row(frame, rows[i], transfer);
    }
}

/// Render a single transfer row
fn render_transfer_row(frame: &mut Frame, area: Rect, transfer: &crate::app::TransferInfo) {
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1), // filename + status
            Constraint::Length(1), // progress bar
            Constraint::Length(1), // speed
        ])
        .split(area);

    // Row 1: direction icon + filename + status
    let dir_icon = match transfer.direction {
        TransferDirection::Send => Span::styled(" ^ ", Style::default().fg(Color::Green)),
        TransferDirection::Receive => Span::styled(" v ", Style::default().fg(Color::Blue)),
    };

    let filename_line = Line::from(vec![
        dir_icon,
        Span::styled(
            transfer.filename.as_str(),
            Style::default().add_modifier(Modifier::BOLD),
        ),
        Span::raw("  "),
        Span::styled(
            transfer.status.as_str(),
            Style::default().fg(Color::DarkGray),
        ),
    ]);
    frame.render_widget(Paragraph::new(filename_line), rows[0]);

    // Row 2: progress gauge
    let pct = (transfer.progress * 100.0) as u16;
    let gauge = Gauge::default()
        .gauge_style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
        .percent(pct.min(100))
        .label(format!("{}%", pct.min(100)));
    frame.render_widget(gauge, rows[1]);

    // Row 3: speed (using SpeedIndicatorCompact widget)
    let is_receiving = transfer.direction == TransferDirection::Receive;
    let speed_widget = SpeedIndicatorCompact::new(transfer.speed_bps, is_receiving);
    // Indent the speed widget
    if rows[2].width > 3 {
        let speed_area = Rect {
            x: rows[2].x + 3,
            y: rows[2].y,
            width: rows[2].width.saturating_sub(3),
            height: rows[2].height,
        };
        frame.render_widget(speed_widget, speed_area);
    }
}
