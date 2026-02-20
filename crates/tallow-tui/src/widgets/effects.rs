//! Visual effects for TUI interactions
//!
//! Provides celebration animations, connection indicators, and encryption status
//! with support for reduced motion accessibility.

use ratatui::prelude::*;

/// Completion burst animation for successful transfers
#[derive(Debug, Clone)]
pub struct CompletionBurst {
    /// Whether the burst is active
    active: bool,
    /// Current animation frame
    frame: u8,
    /// Total number of frames in animation
    total_frames: u8,
    /// Whether reduced motion is enabled
    reduced_motion: bool,
}

impl Default for CompletionBurst {
    fn default() -> Self {
        Self::new()
    }
}

impl CompletionBurst {
    /// Create a new completion burst
    pub fn new() -> Self {
        Self {
            active: false,
            frame: 0,
            total_frames: 8,
            reduced_motion: false,
        }
    }

    /// Create with custom frame count
    pub fn with_frames(total_frames: u8) -> Self {
        Self {
            active: false,
            frame: 0,
            total_frames,
            reduced_motion: false,
        }
    }

    /// Enable reduced motion mode
    pub fn reduced_motion(mut self, reduced_motion: bool) -> Self {
        self.reduced_motion = reduced_motion;
        self
    }

    /// Start the burst animation
    pub fn start(&mut self) {
        self.active = true;
        self.frame = 0;
    }

    /// Stop the burst animation
    pub fn stop(&mut self) {
        self.active = false;
        self.frame = 0;
    }

    /// Advance to next frame
    ///
    /// Returns true if animation is complete
    pub fn tick(&mut self) -> bool {
        if !self.active || self.reduced_motion {
            return true;
        }

        self.frame += 1;
        if self.frame >= self.total_frames {
            self.active = false;
            return true;
        }

        false
    }

    /// Check if burst is active
    pub fn is_active(&self) -> bool {
        self.active && !self.reduced_motion
    }

    /// Render the burst effect as a line of text
    pub fn render_line(&self, center_width: u16) -> Line<'static> {
        if !self.is_active() {
            return Line::from("");
        }

        let progress = self.frame as f32 / self.total_frames as f32;
        let radius = (progress * 10.0) as usize;

        // Create expanding ring of sparkles
        let sparkle_chars = ['✦', '✧', '✦', '✧', '✦'];
        let sparkle_idx = (self.frame as usize) % sparkle_chars.len();
        let sparkle = sparkle_chars[sparkle_idx];

        let center = center_width as usize / 2;
        let mut chars = vec![' '; center_width as usize];

        // Place sparkles in a ring
        for i in 0..8 {
            let angle = (i as f32 / 8.0) * 2.0 * std::f32::consts::PI;
            let x = center as i32 + (angle.cos() * radius as f32) as i32;

            if x >= 0 && (x as usize) < chars.len() {
                chars[x as usize] = sparkle;
            }
        }

        let text: String = chars.iter().collect();
        Line::from(Span::styled(
            text,
            Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD),
        ))
    }
}

/// Connection pulse animation during key exchange
#[derive(Debug, Clone)]
pub struct ConnectionPulse {
    /// Whether the pulse is active
    active: bool,
    /// Current animation frame
    frame: u8,
    /// Whether reduced motion is enabled
    reduced_motion: bool,
}

impl Default for ConnectionPulse {
    fn default() -> Self {
        Self::new()
    }
}

impl ConnectionPulse {
    /// Create a new connection pulse
    pub fn new() -> Self {
        Self {
            active: false,
            frame: 0,
            reduced_motion: false,
        }
    }

    /// Enable reduced motion mode
    pub fn reduced_motion(mut self, reduced_motion: bool) -> Self {
        self.reduced_motion = reduced_motion;
        self
    }

    /// Start the pulse animation
    pub fn start(&mut self) {
        self.active = true;
        self.frame = 0;
    }

    /// Stop the pulse animation
    pub fn stop(&mut self) {
        self.active = false;
        self.frame = 0;
    }

    /// Advance to next frame
    pub fn tick(&mut self) {
        if !self.active || self.reduced_motion {
            return;
        }

        self.frame = (self.frame + 1) % 8;
    }

    /// Check if pulse is active
    pub fn is_active(&self) -> bool {
        self.active
    }

    /// Get current pulse intensity (0.0..1.0)
    pub fn intensity(&self) -> f32 {
        if !self.is_active() || self.reduced_motion {
            return 1.0;
        }

        // Sine wave pulse
        let progress = self.frame as f32 / 8.0;
        let intensity = (progress * 2.0 * std::f32::consts::PI).sin();
        (intensity + 1.0) / 2.0 // Normalize to 0..1
    }

    /// Render as a styled span
    pub fn render_span(&self) -> Span<'static> {
        if self.reduced_motion {
            return Span::styled("🔒", Style::default().fg(Color::Green));
        }

        let intensity = self.intensity();
        let color = if intensity > 0.7 {
            Color::Green
        } else if intensity > 0.4 {
            Color::Yellow
        } else {
            Color::Gray
        };

        let modifier = if intensity > 0.5 {
            Modifier::BOLD
        } else {
            Modifier::empty()
        };

        Span::styled("🔒", Style::default().fg(color).add_modifier(modifier))
    }
}

/// Encryption indicator with animation
pub fn encryption_indicator(is_encrypting: bool, reduced_motion: bool) -> Span<'static> {
    if reduced_motion {
        return if is_encrypting {
            Span::styled(
                "🔒 Encrypted",
                Style::default()
                    .fg(Color::Green)
                    .add_modifier(Modifier::BOLD),
            )
        } else {
            Span::styled("🔓 Not Encrypted", Style::default().fg(Color::Red))
        };
    }

    // Animated version - this should be called with different frame values
    if is_encrypting {
        Span::styled(
            "🔒 Encrypted",
            Style::default()
                .fg(Color::Green)
                .add_modifier(Modifier::BOLD),
        )
    } else {
        Span::styled("🔓 Not Encrypted", Style::default().fg(Color::Red))
    }
}

/// Encryption indicator with frame-based animation
pub fn encryption_indicator_frame(is_encrypting: bool, frame: u8, reduced_motion: bool) -> Span<'static> {
    if reduced_motion {
        return encryption_indicator(is_encrypting, true);
    }

    if is_encrypting {
        // Pulsing lock icon
        let intensity = ((frame as f32 / 8.0) * 2.0 * std::f32::consts::PI).sin();
        let color = if intensity > 0.0 {
            Color::Green
        } else {
            Color::Yellow
        };

        Span::styled(
            "🔒 Encrypted",
            Style::default().fg(color).add_modifier(Modifier::BOLD),
        )
    } else {
        Span::styled("🔓 Not Encrypted", Style::default().fg(Color::Red))
    }
}

/// Progress bar fill character based on percentage
pub fn progress_fill_char(percent: u8) -> char {
    match percent {
        0..=12 => '▁',
        13..=25 => '▂',
        26..=37 => '▃',
        38..=50 => '▄',
        51..=62 => '▅',
        63..=75 => '▆',
        76..=87 => '▇',
        _ => '█',
    }
}

/// Create a transfer speed indicator with animation
pub fn transfer_speed_indicator(speed_mbps: f64, frame: u8, reduced_motion: bool) -> Span<'static> {
    if reduced_motion {
        return Span::styled(
            format!("{:.1} MB/s", speed_mbps),
            Style::default().fg(Color::Cyan),
        );
    }

    // Animated arrow based on speed
    let arrow = if frame % 2 == 0 { "→" } else { "⇒" };
    let color = if speed_mbps > 100.0 {
        Color::Green
    } else if speed_mbps > 10.0 {
        Color::Cyan
    } else {
        Color::Yellow
    };

    Span::styled(
        format!("{} {:.1} MB/s", arrow, speed_mbps),
        Style::default().fg(color).add_modifier(Modifier::BOLD),
    )
}

/// Create a waiting/connecting indicator
pub fn waiting_indicator(frame: u8, reduced_motion: bool) -> Span<'static> {
    if reduced_motion {
        return Span::styled("Waiting...", Style::default().fg(Color::Gray));
    }

    let dots = match frame % 4 {
        0 => "   ",
        1 => ".  ",
        2 => ".. ",
        _ => "...",
    };

    Span::styled(
        format!("Waiting{}", dots),
        Style::default().fg(Color::Gray),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_completion_burst_new() {
        let burst = CompletionBurst::new();
        assert!(!burst.is_active());
        assert_eq!(burst.total_frames, 8);
    }

    #[test]
    fn test_completion_burst_start_stop() {
        let mut burst = CompletionBurst::new();
        burst.start();
        assert!(burst.is_active());

        burst.stop();
        assert!(!burst.is_active());
    }

    #[test]
    fn test_completion_burst_tick() {
        let mut burst = CompletionBurst::with_frames(3);
        burst.start();

        assert!(!burst.tick()); // Frame 1
        assert!(!burst.tick()); // Frame 2
        assert!(burst.tick()); // Frame 3, complete
        assert!(!burst.is_active());
    }

    #[test]
    fn test_completion_burst_reduced_motion() {
        let mut burst = CompletionBurst::new().reduced_motion(true);
        burst.start();
        assert!(!burst.is_active()); // Should not be active with reduced motion
    }

    #[test]
    fn test_connection_pulse_new() {
        let pulse = ConnectionPulse::new();
        assert!(!pulse.is_active());
    }

    #[test]
    fn test_connection_pulse_start_stop() {
        let mut pulse = ConnectionPulse::new();
        pulse.start();
        assert!(pulse.is_active());

        pulse.stop();
        assert!(!pulse.is_active());
    }

    #[test]
    fn test_connection_pulse_tick() {
        let mut pulse = ConnectionPulse::new();
        pulse.start();

        let initial_frame = pulse.frame;
        pulse.tick();
        assert_ne!(pulse.frame, initial_frame);
    }

    #[test]
    fn test_connection_pulse_intensity() {
        let mut pulse = ConnectionPulse::new();
        pulse.start();

        let intensity = pulse.intensity();
        assert!(intensity >= 0.0 && intensity <= 1.0);
    }

    #[test]
    fn test_connection_pulse_reduced_motion() {
        let pulse = ConnectionPulse::new().reduced_motion(true);
        assert_eq!(pulse.intensity(), 1.0);
    }

    #[test]
    fn test_progress_fill_char() {
        assert_eq!(progress_fill_char(0), '▁');
        assert_eq!(progress_fill_char(25), '▂');
        assert_eq!(progress_fill_char(50), '▄');
        assert_eq!(progress_fill_char(75), '▆');
        assert_eq!(progress_fill_char(100), '█');
    }

    #[test]
    fn test_encryption_indicator() {
        let encrypted = encryption_indicator(true, true);
        assert!(encrypted.content.contains("Encrypted"));

        let not_encrypted = encryption_indicator(false, true);
        assert!(not_encrypted.content.contains("Not Encrypted"));
    }

    #[test]
    fn test_encryption_indicator_frame() {
        for frame in 0..8 {
            let indicator = encryption_indicator_frame(true, frame, false);
            assert!(indicator.content.contains("Encrypted"));
        }
    }
}
