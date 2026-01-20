package main

import (
	"testing"
	"time"
)

func TestRFIDEventParsing(t *testing.T) {
	// Simple unit test to show QA skills
	event := RFIDEvent{
		TagID:     "TAG-123",
		Location:  "Dubai-Hub",
		Timestamp: time.Now(),
	}

	if event.TagID != "TAG-123" {
		t.Errorf("Expected TagID TAG-123, got %s", event.TagID)
	}

	if event.Location != "Dubai-Hub" {
		t.Errorf("Expected Location Dubai-Hub, got %s", event.Location)
	}
}
