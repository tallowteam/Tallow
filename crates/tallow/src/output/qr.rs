//! QR code terminal display

/// Display a QR code in the terminal containing the receive command.
///
/// Silently returns `Ok(())` if the terminal is too narrow (< 41 columns).
/// The QR code encodes the full `tallow receive <code>` command so the
/// receiver can scan it directly.
pub fn display_receive_qr(code_phrase: &str) -> std::io::Result<()> {
    let receive_cmd = format!("tallow receive {}", code_phrase);

    // Check terminal width -- QR codes need ~41+ columns minimum
    let (width, _) = crossterm::terminal::size().unwrap_or((80, 24));
    if width < 41 {
        tracing::debug!("Terminal too narrow ({} cols) for QR code; skipping", width);
        return Ok(());
    }

    qr2term::print_qr(&receive_cmd)
        .map_err(|e| std::io::Error::other(format!("QR generation failed: {e}")))
}
