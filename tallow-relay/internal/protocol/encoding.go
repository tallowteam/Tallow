package protocol

import (
	"encoding/json"
)

// EncodeMessage serializes a message to JSON bytes
func EncodeMessage(msg *Message) ([]byte, error) {
	return json.Marshal(msg)
}

// DecodeMessage deserializes a message from JSON bytes
func DecodeMessage(data []byte) (*Message, error) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, err
	}
	return &msg, nil
}

// MustEncodeMessage encodes a message or panics
func MustEncodeMessage(msg *Message) []byte {
	data, err := EncodeMessage(msg)
	if err != nil {
		panic(err)
	}
	return data
}

// EncodePayload serializes a payload struct to JSON
func EncodePayload(payload interface{}) (json.RawMessage, error) {
	return json.Marshal(payload)
}

// DecodePayload deserializes a payload from raw JSON
func DecodePayload(data json.RawMessage, v interface{}) error {
	return json.Unmarshal(data, v)
}
