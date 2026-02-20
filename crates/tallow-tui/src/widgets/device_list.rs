//! Device list widget.
//!
//! Displays a scrollable list of peer devices with keyboard navigation.
//! Supports j/k navigation and highlights the selected device.

use ratatui::prelude::*;
use ratatui::widgets::*;

use super::device_card::{DeviceCard, Platform, TrustLevel};

/// Information about a peer device.
#[derive(Debug, Clone)]
pub struct DeviceInfo {
    /// Unique identifier for the device
    pub id: String,
    /// Human-readable device name
    pub name: String,
    /// Operating system platform
    pub platform: Platform,
    /// Trust level for this device
    pub trust_level: TrustLevel,
    /// Whether the device is currently online/reachable
    pub is_online: bool,
    /// Truncated cryptographic fingerprint
    pub fingerprint_prefix: String,
}

impl DeviceInfo {
    /// Creates a new device info.
    pub fn new(
        id: impl Into<String>,
        name: impl Into<String>,
        platform: Platform,
        trust_level: TrustLevel,
        is_online: bool,
        fingerprint_prefix: impl Into<String>,
    ) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            platform,
            trust_level,
            is_online,
            fingerprint_prefix: fingerprint_prefix.into(),
        }
    }

    /// Converts this device info into a device card widget.
    pub fn into_card(self) -> DeviceCard {
        DeviceCard::new(
            self.name,
            self.platform,
            self.trust_level,
            self.is_online,
            self.fingerprint_prefix,
        )
    }

    /// Creates a device card widget from this info.
    pub fn as_card(&self) -> DeviceCard {
        DeviceCard::new(
            self.name.clone(),
            self.platform,
            self.trust_level,
            self.is_online,
            self.fingerprint_prefix.clone(),
        )
    }
}

/// A scrollable list of device cards with keyboard navigation.
///
/// Displays multiple devices in a scrollable list with selection highlighting.
/// Supports navigation with j/k keys and shows scroll position indicators.
#[derive(Debug, Clone)]
pub struct DeviceList {
    /// List of devices to display
    pub devices: Vec<DeviceInfo>,
    /// Currently selected device index
    pub selected_index: usize,
    /// Vertical scroll offset for the list
    pub scroll_offset: usize,
}

impl DeviceList {
    /// Creates a new device list widget.
    pub fn new(devices: Vec<DeviceInfo>) -> Self {
        Self {
            devices,
            selected_index: 0,
            scroll_offset: 0,
        }
    }

    /// Creates a new device list with a specific selection.
    pub fn with_selection(devices: Vec<DeviceInfo>, selected_index: usize) -> Self {
        let selected_index = selected_index.min(devices.len().saturating_sub(1));
        Self {
            devices,
            selected_index,
            scroll_offset: 0,
        }
    }

    /// Moves the selection down by one item.
    pub fn select_next(&mut self) {
        if self.devices.is_empty() {
            return;
        }
        self.selected_index = (self.selected_index + 1).min(self.devices.len() - 1);
    }

    /// Moves the selection up by one item.
    pub fn select_previous(&mut self) {
        if self.selected_index > 0 {
            self.selected_index -= 1;
        }
    }

    /// Gets the currently selected device, if any.
    pub fn selected_device(&self) -> Option<&DeviceInfo> {
        self.devices.get(self.selected_index)
    }

    /// Gets the currently selected device ID, if any.
    pub fn selected_id(&self) -> Option<&str> {
        self.selected_device().map(|d| d.id.as_str())
    }

    /// Calculates the visible range of devices based on area height and scroll offset.
    fn visible_range(&self, height: usize) -> (usize, usize) {
        // Each device card takes 4 rows (3 content + 1 spacing)
        const CARD_HEIGHT: usize = 5;

        let cards_per_page = height / CARD_HEIGHT;
        if cards_per_page == 0 {
            return (0, 0);
        }

        let start = self.scroll_offset;
        let end = (start + cards_per_page).min(self.devices.len());

        (start, end)
    }

    /// Updates scroll offset to ensure selected item is visible.
    pub fn ensure_visible(&mut self, height: usize) {
        const CARD_HEIGHT: usize = 5;
        let cards_per_page = height / CARD_HEIGHT;

        if cards_per_page == 0 {
            return;
        }

        // Scroll down if selection is below visible area
        if self.selected_index >= self.scroll_offset + cards_per_page {
            self.scroll_offset = self.selected_index.saturating_sub(cards_per_page - 1);
        }

        // Scroll up if selection is above visible area
        if self.selected_index < self.scroll_offset {
            self.scroll_offset = self.selected_index;
        }
    }

    /// Returns whether there are more devices above the visible area.
    fn has_scroll_up(&self) -> bool {
        self.scroll_offset > 0
    }

    /// Returns whether there are more devices below the visible area.
    fn has_scroll_down(&self, height: usize) -> bool {
        let (_, end) = self.visible_range(height);
        end < self.devices.len()
    }
}

impl Widget for DeviceList {
    fn render(mut self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let block = Block::default()
            .title("Devices")
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Cyan))
            .border_type(BorderType::Rounded);

        let inner = block.inner(area);
        block.render(area, buf);

        if self.devices.is_empty() {
            let empty_msg = "No devices found";
            let empty_style = Style::default()
                .fg(Color::DarkGray)
                .add_modifier(Modifier::DIM);
            let x = inner.x + (inner.width.saturating_sub(empty_msg.len() as u16)) / 2;
            let y = inner.y + inner.height / 2;
            buf.set_string(x, y, empty_msg, empty_style);
            return;
        }

        // Ensure selected item is visible
        self.ensure_visible(inner.height as usize);

        let (start, end) = self.visible_range(inner.height as usize);
        const CARD_HEIGHT: u16 = 5;

        let mut y = inner.y;

        // Render scroll up indicator
        if self.has_scroll_up() {
            let indicator = "▲ More devices above ▲";
            let x = inner.x + (inner.width.saturating_sub(indicator.len() as u16)) / 2;
            buf.set_string(x, y, indicator, Style::default().fg(Color::Yellow));
            y += 1;
        }

        // Render visible devices
        for (idx, device) in self.devices[start..end].iter().enumerate() {
            let absolute_idx = start + idx;
            let is_selected = absolute_idx == self.selected_index;

            let card_area = Rect {
                x: inner.x,
                y,
                width: inner.width,
                height: CARD_HEIGHT.saturating_sub(1),
            };

            // Render selection highlight background
            if is_selected {
                let highlight_style = Style::default()
                    .bg(Color::DarkGray)
                    .add_modifier(Modifier::BOLD);

                for dy in 0..card_area.height {
                    for dx in 0..card_area.width {
                        let cell = &mut buf[(card_area.x + dx, card_area.y + dy)];
                        cell.set_style(highlight_style);
                    }
                }
            }

            // Render device card
            let card = device.as_card();
            card.render(card_area, buf);

            y += CARD_HEIGHT;

            if y >= inner.y + inner.height {
                break;
            }
        }

        // Render scroll down indicator
        if self.has_scroll_down(inner.height as usize) {
            let indicator = "▼ More devices below ▼";
            let y_pos = inner.y + inner.height.saturating_sub(1);
            let x = inner.x + (inner.width.saturating_sub(indicator.len() as u16)) / 2;
            buf.set_string(x, y_pos, indicator, Style::default().fg(Color::Yellow));
        }

        // Render scroll position indicator
        if self.devices.len() > 1 {
            let scroll_info = format!("{}/{}", self.selected_index + 1, self.devices.len());
            let x = inner.x + inner.width.saturating_sub(scroll_info.len() as u16 + 1);
            let y = inner.y + inner.height.saturating_sub(1);
            buf.set_string(x, y, &scroll_info, Style::default().fg(Color::DarkGray));
        }
    }
}

/// Compact horizontal device list variant (single line per device).
#[derive(Debug, Clone)]
pub struct DeviceListCompact {
    /// List of devices to display
    pub devices: Vec<DeviceInfo>,
    /// Currently selected device index
    pub selected_index: usize,
}

impl DeviceListCompact {
    /// Creates a new compact device list.
    pub fn new(devices: Vec<DeviceInfo>) -> Self {
        Self {
            devices,
            selected_index: 0,
        }
    }

    /// Moves selection to next device.
    pub fn select_next(&mut self) {
        if self.devices.is_empty() {
            return;
        }
        self.selected_index = (self.selected_index + 1).min(self.devices.len() - 1);
    }

    /// Moves selection to previous device.
    pub fn select_previous(&mut self) {
        if self.selected_index > 0 {
            self.selected_index -= 1;
        }
    }

    /// Gets currently selected device.
    pub fn selected_device(&self) -> Option<&DeviceInfo> {
        self.devices.get(self.selected_index)
    }
}

impl Widget for DeviceListCompact {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 || self.devices.is_empty() {
            return;
        }

        let block = Block::default()
            .title("Devices")
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Cyan));

        let inner = block.inner(area);
        block.render(area, buf);

        let mut y = inner.y;

        for (idx, device) in self.devices.iter().enumerate() {
            if y >= inner.y + inner.height {
                break;
            }

            let is_selected = idx == self.selected_index;
            let line_style = if is_selected {
                Style::default()
                    .bg(Color::DarkGray)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default()
            };

            // Format: > 🍎 ✅ ● Alice's MacBook
            let prefix = if is_selected { "> " } else { "  " };
            let status = if device.is_online { "●" } else { "○" };
            let _status_color = if device.is_online {
                Color::Green
            } else {
                Color::Gray
            };

            let line = format!(
                "{}{} {} {} {}",
                prefix,
                device.platform.icon(),
                device.trust_level.icon(),
                status,
                device.name
            );

            buf.set_string(inner.x, y, &line, line_style);
            y += 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_devices(count: usize) -> Vec<DeviceInfo> {
        (0..count)
            .map(|i| {
                DeviceInfo::new(
                    format!("device-{}", i),
                    format!("Device {}", i),
                    Platform::Linux,
                    TrustLevel::Seen,
                    true,
                    format!("FP{:02X}", i),
                )
            })
            .collect()
    }

    #[test]
    fn test_device_list_creation() {
        let devices = create_test_devices(5);
        let list = DeviceList::new(devices.clone());
        assert_eq!(list.devices.len(), 5);
        assert_eq!(list.selected_index, 0);
    }

    #[test]
    fn test_select_next() {
        let devices = create_test_devices(5);
        let mut list = DeviceList::new(devices);

        assert_eq!(list.selected_index, 0);
        list.select_next();
        assert_eq!(list.selected_index, 1);
        list.select_next();
        assert_eq!(list.selected_index, 2);

        // Should not go beyond bounds
        for _ in 0..10 {
            list.select_next();
        }
        assert_eq!(list.selected_index, 4);
    }

    #[test]
    fn test_select_previous() {
        let devices = create_test_devices(5);
        let mut list = DeviceList::with_selection(devices, 3);

        assert_eq!(list.selected_index, 3);
        list.select_previous();
        assert_eq!(list.selected_index, 2);
        list.select_previous();
        assert_eq!(list.selected_index, 1);

        // Should not go below 0
        for _ in 0..10 {
            list.select_previous();
        }
        assert_eq!(list.selected_index, 0);
    }

    #[test]
    fn test_selected_device() {
        let devices = create_test_devices(3);
        let mut list = DeviceList::new(devices);

        assert_eq!(list.selected_device().unwrap().id, "device-0");
        list.select_next();
        assert_eq!(list.selected_device().unwrap().id, "device-1");
    }

    #[test]
    fn test_empty_list() {
        let list = DeviceList::new(vec![]);
        assert!(list.selected_device().is_none());
    }

    #[test]
    fn test_visible_range() {
        let devices = create_test_devices(20);
        let list = DeviceList::new(devices);

        // With 25 height, we can show 5 cards (each card = 5 rows)
        let (start, end) = list.visible_range(25);
        assert_eq!(start, 0);
        assert_eq!(end, 5);
    }

    #[test]
    fn test_ensure_visible() {
        let devices = create_test_devices(20);
        let mut list = DeviceList::new(devices);

        // Select device beyond first page
        list.selected_index = 10;
        list.ensure_visible(25); // Can show 5 cards

        // Should scroll so selected is visible
        assert!(list.scroll_offset <= 10);
        assert!(10 < list.scroll_offset + 5);
    }
}
