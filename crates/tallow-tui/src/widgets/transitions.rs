//! Panel transition animations for smooth UI state changes
//!
//! Provides slide and fade transitions with support for reduced motion accessibility.

use ratatui::prelude::*;

/// Type of transition animation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Transition {
    /// No transition
    None,
    /// Slide content from right to left
    SlideLeft,
    /// Slide content from left to right
    SlideRight,
    /// Fade content in
    FadeIn,
    /// Fade content out
    FadeOut,
}

impl Default for Transition {
    fn default() -> Self {
        Self::None
    }
}

/// Direction for slide transitions
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SlideDirection {
    /// Slide left
    Left,
    /// Slide right
    Right,
    /// Slide up
    Up,
    /// Slide down
    Down,
}

/// Easing function for smooth animations
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Easing {
    /// Linear progression
    Linear,
    /// Ease in (slow start)
    EaseIn,
    /// Ease out (slow end)
    EaseOut,
    /// Ease in and out (slow start and end)
    EaseInOut,
}

impl Easing {
    /// Apply easing function to progress value (0.0..1.0)
    pub fn apply(self, progress: f64) -> f64 {
        match self {
            Easing::Linear => progress,
            Easing::EaseIn => progress * progress,
            Easing::EaseOut => progress * (2.0 - progress),
            Easing::EaseInOut => {
                if progress < 0.5 {
                    2.0 * progress * progress
                } else {
                    -1.0 + (4.0 - 2.0 * progress) * progress
                }
            }
        }
    }
}

/// State of an ongoing transition
#[derive(Debug, Clone)]
pub struct TransitionState {
    /// Type of transition
    transition: Transition,
    /// Current progress (0.0 = start, 1.0 = complete)
    progress: f64,
    /// Total number of frames for the transition
    duration_frames: u8,
    /// Current frame number
    current_frame: u8,
    /// Easing function to use
    easing: Easing,
    /// Whether reduced motion is enabled
    reduced_motion: bool,
}

impl Default for TransitionState {
    fn default() -> Self {
        Self::new(Transition::None, 10)
    }
}

impl TransitionState {
    /// Create a new transition state
    pub fn new(transition: Transition, duration_frames: u8) -> Self {
        Self {
            transition,
            progress: 0.0,
            duration_frames,
            current_frame: 0,
            easing: Easing::EaseInOut,
            reduced_motion: false,
        }
    }

    /// Create with custom easing
    pub fn with_easing(transition: Transition, duration_frames: u8, easing: Easing) -> Self {
        Self {
            transition,
            progress: 0.0,
            duration_frames,
            current_frame: 0,
            easing,
            reduced_motion: false,
        }
    }

    /// Enable or disable reduced motion
    pub fn reduced_motion(mut self, reduced_motion: bool) -> Self {
        self.reduced_motion = reduced_motion;
        // Skip directly to end if reduced motion is enabled
        if reduced_motion {
            self.progress = 1.0;
            self.current_frame = self.duration_frames;
        }
        self
    }

    /// Advance the transition by one frame
    ///
    /// Returns true if the transition is complete
    pub fn tick(&mut self) -> bool {
        if self.reduced_motion {
            return true;
        }

        if self.current_frame >= self.duration_frames {
            self.progress = 1.0;
            return true;
        }

        self.current_frame += 1;
        let raw_progress = self.current_frame as f64 / self.duration_frames as f64;
        self.progress = self.easing.apply(raw_progress);

        self.is_complete()
    }

    /// Check if transition is complete
    pub fn is_complete(&self) -> bool {
        self.progress >= 1.0 || self.reduced_motion
    }

    /// Get current progress (0.0..1.0)
    pub fn progress(&self) -> f64 {
        self.progress
    }

    /// Get the transition type
    pub fn transition(&self) -> Transition {
        self.transition
    }

    /// Reset the transition to start
    pub fn reset(&mut self) {
        self.current_frame = 0;
        self.progress = 0.0;
    }
}

/// Apply a slide transition to a rectangle area
///
/// Returns a modified Rect that represents the interpolated position
pub fn apply_slide(area: Rect, progress: f64, direction: SlideDirection) -> Rect {
    let progress = progress.clamp(0.0, 1.0);

    match direction {
        SlideDirection::Left => {
            // Start off-screen to the right, slide to final position
            let start_x = area.x + area.width;
            let end_x = area.x;
            let current_x = start_x as f64 + (end_x as f64 - start_x as f64) * progress;

            Rect {
                x: current_x as u16,
                y: area.y,
                width: area.width,
                height: area.height,
            }
        }
        SlideDirection::Right => {
            // Start at final position, slide off-screen to the right
            let start_x = area.x;
            let end_x = area.x + area.width;
            let current_x = start_x as f64 + (end_x as f64 - start_x as f64) * progress;

            Rect {
                x: current_x as u16,
                y: area.y,
                width: area.width,
                height: area.height,
            }
        }
        SlideDirection::Up => {
            // Start below, slide up to final position
            let start_y = area.y + area.height;
            let end_y = area.y;
            let current_y = start_y as f64 + (end_y as f64 - start_y as f64) * progress;

            Rect {
                x: area.x,
                y: current_y as u16,
                width: area.width,
                height: area.height,
            }
        }
        SlideDirection::Down => {
            // Start at final position, slide down
            let start_y = area.y;
            let end_y = area.y + area.height;
            let current_y = start_y as f64 + (end_y as f64 - start_y as f64) * progress;

            Rect {
                x: area.x,
                y: current_y as u16,
                width: area.width,
                height: area.height,
            }
        }
    }
}

/// Apply a fade transition to a style
///
/// Modulates the color intensity based on progress
pub fn apply_fade(style: Style, progress: f64) -> Style {
    let progress = progress.clamp(0.0, 1.0);

    // For fade out, invert progress
    let alpha = progress;

    if alpha < 0.3 {
        // Very transparent, use dim modifier
        style.add_modifier(Modifier::DIM)
    } else if alpha < 0.7 {
        // Partially faded
        style
    } else {
        // Fully visible
        style.remove_modifier(Modifier::DIM)
    }
}

/// Apply fade in effect
pub fn apply_fade_in(style: Style, progress: f64) -> Style {
    apply_fade(style, progress)
}

/// Apply fade out effect
pub fn apply_fade_out(style: Style, progress: f64) -> Style {
    apply_fade(style, 1.0 - progress)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transition_state_new() {
        let state = TransitionState::new(Transition::FadeIn, 10);
        assert_eq!(state.transition, Transition::FadeIn);
        assert_eq!(state.duration_frames, 10);
        assert_eq!(state.current_frame, 0);
        assert_eq!(state.progress, 0.0);
    }

    #[test]
    fn test_transition_state_tick() {
        let mut state = TransitionState::new(Transition::FadeIn, 5);
        assert!(!state.is_complete());

        for _ in 0..5 {
            let complete = state.tick();
            if state.current_frame >= 5 {
                assert!(complete);
            }
        }

        assert!(state.is_complete());
        assert_eq!(state.progress(), 1.0);
    }

    #[test]
    fn test_transition_state_reduced_motion() {
        let state = TransitionState::new(Transition::FadeIn, 10).reduced_motion(true);
        assert!(state.is_complete());
        assert_eq!(state.progress(), 1.0);
    }

    #[test]
    fn test_transition_state_reset() {
        let mut state = TransitionState::new(Transition::FadeIn, 5);
        state.tick();
        state.tick();
        assert!(state.progress > 0.0);

        state.reset();
        assert_eq!(state.progress, 0.0);
        assert_eq!(state.current_frame, 0);
    }

    #[test]
    fn test_easing_linear() {
        let easing = Easing::Linear;
        assert_eq!(easing.apply(0.0), 0.0);
        assert_eq!(easing.apply(0.5), 0.5);
        assert_eq!(easing.apply(1.0), 1.0);
    }

    #[test]
    fn test_easing_ease_in() {
        let easing = Easing::EaseIn;
        assert_eq!(easing.apply(0.0), 0.0);
        assert!(easing.apply(0.5) < 0.5); // Slower start
        assert_eq!(easing.apply(1.0), 1.0);
    }

    #[test]
    fn test_easing_ease_out() {
        let easing = Easing::EaseOut;
        assert_eq!(easing.apply(0.0), 0.0);
        assert!(easing.apply(0.5) > 0.5); // Slower end
        assert_eq!(easing.apply(1.0), 1.0);
    }

    #[test]
    fn test_apply_slide_left() {
        let area = Rect::new(10, 10, 50, 20);

        // At progress 0, should be off-screen to the right
        let start = apply_slide(area, 0.0, SlideDirection::Left);
        assert!(start.x >= area.x);

        // At progress 1, should be at final position
        let end = apply_slide(area, 1.0, SlideDirection::Left);
        assert_eq!(end.x, area.x);
    }

    #[test]
    fn test_apply_slide_right() {
        let area = Rect::new(10, 10, 50, 20);

        // At progress 0, should be at start position
        let start = apply_slide(area, 0.0, SlideDirection::Right);
        assert_eq!(start.x, area.x);

        // At progress 1, should be off-screen to the right
        let end = apply_slide(area, 1.0, SlideDirection::Right);
        assert!(end.x > area.x);
    }

    #[test]
    fn test_apply_fade() {
        let style = Style::default();

        let faded_low = apply_fade(style, 0.2);
        assert!(faded_low.add_modifier.contains(Modifier::DIM));

        let faded_high = apply_fade(style, 0.9);
        assert!(!faded_high.add_modifier.contains(Modifier::DIM));
    }

    #[test]
    fn test_apply_fade_in() {
        let style = Style::default();

        let start = apply_fade_in(style, 0.0);
        assert!(start.add_modifier.contains(Modifier::DIM));

        let end = apply_fade_in(style, 1.0);
        assert!(!end.add_modifier.contains(Modifier::DIM));
    }

    #[test]
    fn test_apply_fade_out() {
        let style = Style::default();

        let start = apply_fade_out(style, 0.0);
        assert!(!start.add_modifier.contains(Modifier::DIM));

        let end = apply_fade_out(style, 1.0);
        assert!(end.add_modifier.contains(Modifier::DIM));
    }
}
