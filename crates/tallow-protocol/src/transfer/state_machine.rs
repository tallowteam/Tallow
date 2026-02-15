//! Transfer state machine

use crate::{ProtocolError, Result};

/// Transfer states
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferState {
    /// Idle, no transfer
    Idle,
    /// Connecting to peer
    Connecting,
    /// Negotiating transfer parameters
    Negotiating,
    /// Actively transferring
    Transferring,
    /// Transfer paused
    Paused,
    /// Transfer completed successfully
    Completed,
    /// Transfer failed
    Failed,
}

/// Transfer state machine
#[derive(Debug)]
pub struct TransferStateMachine {
    state: TransferState,
}

impl TransferStateMachine {
    /// Create a new state machine
    pub fn new() -> Self {
        Self {
            state: TransferState::Idle,
        }
    }

    /// Get current state
    pub fn state(&self) -> TransferState {
        self.state
    }

    /// Transition to a new state
    pub fn transition(&mut self, new_state: TransferState) -> Result<()> {
        // Validate transition
        let valid = match (self.state, new_state) {
            (TransferState::Idle, TransferState::Connecting) => true,
            (TransferState::Connecting, TransferState::Negotiating) => true,
            (TransferState::Negotiating, TransferState::Transferring) => true,
            (TransferState::Transferring, TransferState::Paused) => true,
            (TransferState::Paused, TransferState::Transferring) => true,
            (TransferState::Transferring, TransferState::Completed) => true,
            (_, TransferState::Failed) => true, // Can fail from any state
            _ => false,
        };

        if !valid {
            return Err(ProtocolError::InvalidStateTransition {
                from: format!("{:?}", self.state),
                to: format!("{:?}", new_state),
            });
        }

        self.state = new_state;
        Ok(())
    }
}

impl Default for TransferStateMachine {
    fn default() -> Self {
        Self::new()
    }
}
