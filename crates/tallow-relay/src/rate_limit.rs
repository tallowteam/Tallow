//! Rate limiting

use std::collections::HashMap;
use std::net::IpAddr;
use std::time::Instant;

/// Rate limiter
#[derive(Debug)]
pub struct RateLimiter {
    /// Requests per second limit
    limit: u32,
    /// IP -> (request count, window start)
    state: HashMap<IpAddr, (u32, Instant)>,
}

impl RateLimiter {
    /// Create a new rate limiter
    pub fn new(limit: u32) -> Self {
        Self {
            limit,
            state: HashMap::new(),
        }
    }

    /// Check if request should be allowed
    pub fn check(&mut self, ip: IpAddr) -> bool {
        let now = Instant::now();
        let entry = self.state.entry(ip).or_insert((0, now));

        // Reset window if expired
        if now.duration_since(entry.1).as_secs() >= 1 {
            *entry = (1, now);
            return true;
        }

        // Check limit
        if entry.0 < self.limit {
            entry.0 += 1;
            true
        } else {
            false
        }
    }
}
