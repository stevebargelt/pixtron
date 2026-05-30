package sports

import "testing"

func TestParseNHLGameIntermission(t *testing.T) {
	g := nhlGame{
		ID:               123,
		GameState:        "LIVE",
		PeriodDescriptor: nhlPeriodDesc{Number: 2, PeriodType: "REG"},
		Clock:            nhlClock{TimeRemaining: "17:34", InIntermission: true},
	}
	snap, ok := parseNHLGame(g)
	if !ok {
		t.Fatal("parseNHLGame returned ok=false")
	}
	if !snap.Intermission {
		t.Error("expected Intermission=true when clock.inIntermission is set")
	}
	if snap.Period != 2 {
		t.Errorf("Period = %d, want 2", snap.Period)
	}
	if snap.DisplayClock != "17:34" {
		t.Errorf("DisplayClock = %q, want \"17:34\"", snap.DisplayClock)
	}
}

func TestParseNHLGameInPlayNotIntermission(t *testing.T) {
	g := nhlGame{
		ID:               456,
		GameState:        "LIVE",
		PeriodDescriptor: nhlPeriodDesc{Number: 1, PeriodType: "REG"},
		Clock:            nhlClock{TimeRemaining: "12:00"},
	}
	snap, ok := parseNHLGame(g)
	if !ok {
		t.Fatal("parseNHLGame returned ok=false")
	}
	if snap.Intermission {
		t.Error("expected Intermission=false during in-play")
	}
}
