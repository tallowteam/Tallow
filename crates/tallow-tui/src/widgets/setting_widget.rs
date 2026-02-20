//! Individual setting widget renderers for different setting types.
//!
//! Provides specialized widgets for toggles, text inputs, numeric inputs, and choice selectors.
//! Handles user input and validation for each setting type.

use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Paragraph, Widget},
};

/// Different types of settings with their values.
#[derive(Debug, Clone, PartialEq)]
pub enum SettingType {
    /// Boolean toggle (ON/OFF)
    Toggle(bool),
    /// Text input
    Text(String),
    /// Numeric input with value, min, and max
    Number(i64, i64, i64),
    /// Multiple choice with options and selected index
    Choice(Vec<String>, usize),
}

impl SettingType {
    /// Returns a string representation of the current value.
    pub fn display_value(&self) -> String {
        match self {
            SettingType::Toggle(value) => {
                if *value {
                    "[ON]".to_string()
                } else {
                    "[OFF]".to_string()
                }
            }
            SettingType::Text(text) => format!("\"{}\"", text),
            SettingType::Number(value, min, max) => {
                format!("{} ({}-{})", value, min, max)
            }
            SettingType::Choice(options, selected) => {
                if *selected < options.len() {
                    format!("< {} >", options[*selected])
                } else {
                    "< Invalid >".to_string()
                }
            }
        }
    }
}

/// Individual setting widget with label, description, and value.
#[derive(Debug, Clone)]
pub struct SettingWidget {
    /// Display label for the setting
    pub label: String,
    /// Detailed description
    pub description: String,
    /// Setting type and value
    pub setting_type: SettingType,
    /// Whether this setting is currently focused for editing
    pub is_focused: bool,
    /// Whether this setting has been modified from default
    pub is_modified: bool,
    /// Original value for reset functionality
    original_value: SettingType,
}

impl SettingWidget {
    /// Creates a new setting widget.
    pub fn new(label: impl Into<String>, description: impl Into<String>, setting_type: SettingType) -> Self {
        let original_value = setting_type.clone();
        Self {
            label: label.into(),
            description: description.into(),
            setting_type,
            is_focused: false,
            is_modified: false,
            original_value,
        }
    }

    /// Handles keyboard input for this setting.
    pub fn handle_input(&mut self, key: KeyEvent) {
        match &mut self.setting_type {
            SettingType::Toggle(ref mut value) => {
                if key.code == KeyCode::Enter || key.code == KeyCode::Char(' ') {
                    *value = !*value;
                    self.check_modified();
                }
            }
            SettingType::Text(ref mut text) => {
                match key.code {
                    KeyCode::Char(c) => {
                        text.push(c);
                        self.check_modified();
                    }
                    KeyCode::Backspace => {
                        text.pop();
                        self.check_modified();
                    }
                    _ => {}
                }
            }
            SettingType::Number(ref mut value, min, max) => {
                match key.code {
                    KeyCode::Up | KeyCode::Char('+') => {
                        if *value < *max {
                            *value += 1;
                            self.check_modified();
                        }
                    }
                    KeyCode::Down | KeyCode::Char('-') => {
                        if *value > *min {
                            *value -= 1;
                            self.check_modified();
                        }
                    }
                    KeyCode::Char(c) if c.is_ascii_digit() => {
                        // Allow typing numbers
                        let digit = c.to_digit(10).unwrap_or(0) as i64;
                        let new_value = *value * 10 + digit;
                        if new_value <= *max {
                            *value = new_value;
                            self.check_modified();
                        }
                    }
                    KeyCode::Backspace => {
                        *value /= 10;
                        if *value < *min {
                            *value = *min;
                        }
                        self.check_modified();
                    }
                    _ => {}
                }
            }
            SettingType::Choice(options, ref mut selected) => {
                match key.code {
                    KeyCode::Left | KeyCode::Char('h') => {
                        if *selected > 0 {
                            *selected -= 1;
                            self.check_modified();
                        }
                    }
                    KeyCode::Right | KeyCode::Char('l') => {
                        if *selected + 1 < options.len() {
                            *selected += 1;
                            self.check_modified();
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    /// Checks if the setting has been modified from its original value.
    fn check_modified(&mut self) {
        self.is_modified = self.setting_type != self.original_value;
    }

    /// Resets the setting to its original value.
    pub fn reset(&mut self) {
        self.setting_type = self.original_value.clone();
        self.is_modified = false;
    }

    /// Returns the current value of the setting.
    pub fn value(&self) -> &SettingType {
        &self.setting_type
    }

    /// Renders the setting widget.
    pub fn render(&self, area: Rect, buf: &mut Buffer, is_selected: bool) {
        if area.height < 2 {
            return;
        }

        // Render label line
        let label_style = if is_selected {
            Style::default()
                .fg(Color::Yellow)
                .add_modifier(Modifier::BOLD)
        } else {
            Style::default().fg(Color::White)
        };

        let focus_indicator = if self.is_focused {
            "▶ "
        } else if is_selected {
            "> "
        } else {
            "  "
        };

        let modified_indicator = if self.is_modified { "●" } else { " " };

        let label_line = Line::from(vec![
            Span::styled(focus_indicator, label_style),
            Span::styled(&self.label, label_style),
            Span::styled(
                format!(" {}", modified_indicator),
                Style::default().fg(Color::Green),
            ),
        ]);

        let label_para = Paragraph::new(label_line);
        let label_area = Rect {
            x: area.x,
            y: area.y,
            width: area.width,
            height: 1,
        };
        label_para.render(label_area, buf);

        // Render value and description line
        if area.height >= 2 {
            let value_style = if self.is_focused {
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD | Modifier::UNDERLINED)
            } else if is_selected {
                Style::default().fg(Color::Cyan)
            } else {
                Style::default().fg(Color::DarkGray)
            };

            let value_line = Line::from(vec![
                Span::raw("    "),
                Span::styled(self.setting_type.display_value(), value_style),
                Span::styled(
                    format!(" - {}", self.description),
                    Style::default()
                        .fg(Color::DarkGray)
                        .add_modifier(Modifier::ITALIC),
                ),
            ]);

            let value_para = Paragraph::new(value_line);
            let value_area = Rect {
                x: area.x,
                y: area.y + 1,
                width: area.width,
                height: 1,
            };
            value_para.render(value_area, buf);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_toggle_setting() {
        let mut setting = SettingWidget::new(
            "Test Toggle",
            "A test toggle",
            SettingType::Toggle(false),
        );

        assert!(!setting.is_modified);

        setting.handle_input(KeyEvent::from(KeyCode::Enter));

        if let SettingType::Toggle(value) = setting.setting_type {
            assert!(value);
        } else {
            panic!("Wrong setting type");
        }

        assert!(setting.is_modified);
    }

    #[test]
    fn test_number_setting() {
        let mut setting = SettingWidget::new(
            "Test Number",
            "A test number",
            SettingType::Number(50, 0, 100),
        );

        setting.handle_input(KeyEvent::from(KeyCode::Up));

        if let SettingType::Number(value, _, _) = setting.setting_type {
            assert_eq!(value, 51);
        } else {
            panic!("Wrong setting type");
        }
    }

    #[test]
    fn test_choice_setting() {
        let mut setting = SettingWidget::new(
            "Test Choice",
            "A test choice",
            SettingType::Choice(vec!["Option 1".into(), "Option 2".into(), "Option 3".into()], 0),
        );

        setting.handle_input(KeyEvent::from(KeyCode::Right));

        if let SettingType::Choice(_, selected) = setting.setting_type {
            assert_eq!(selected, 1);
        } else {
            panic!("Wrong setting type");
        }
    }

    #[test]
    fn test_text_setting() {
        let mut setting = SettingWidget::new(
            "Test Text",
            "A test text",
            SettingType::Text("Hello".into()),
        );

        setting.handle_input(KeyEvent::from(KeyCode::Char('!')));

        if let SettingType::Text(text) = setting.setting_type {
            assert_eq!(text, "Hello!");
        } else {
            panic!("Wrong setting type");
        }
    }

    #[test]
    fn test_reset_setting() {
        let mut setting = SettingWidget::new(
            "Test Reset",
            "A test reset",
            SettingType::Toggle(false),
        );

        setting.handle_input(KeyEvent::from(KeyCode::Enter));
        assert!(setting.is_modified);

        setting.reset();
        assert!(!setting.is_modified);

        if let SettingType::Toggle(value) = setting.setting_type {
            assert!(!value);
        }
    }
}
