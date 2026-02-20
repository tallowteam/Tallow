# Relay Protocol Reference

## Design Principles
- Relay is a dumb pipe: encrypted bytes in, encrypted bytes out
- Zero data retention on relays
- Session IDs are BLAKE3 hash of code phrase (relay never sees phrase)
- E2E encryption: relay cannot read content

## Wire Format
- Serialization: postcard (Serde, no_std, compact binary)
- Versioned protocol with capability flags
- TLV extension mechanism for future features

## Message Types
- SessionJoin: Client joins with session ID
- SessionReady: Both parties connected
- Data: Encrypted chunk payload
- Ack: Chunk received confirmation
- Error: Protocol-level errors (never crypto details)
- Close: Session teardown

## State Machine
```
Waiting -> Paired -> Exchanging -> Transferring -> Complete
   |         |          |             |
   +-------- +----------+-------------+-> Error -> Cleanup
```
