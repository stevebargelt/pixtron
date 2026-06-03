package sports

import "testing"

func TestInningHalf(t *testing.T) {
	cases := []struct {
		detail string
		want   string
	}{
		{"Top 9th", "Top"},
		{"Bottom 3rd", "Bottom"},
		{"Middle 5th", "Top"},
		{"End 7th", "Bottom"},
		{"Final", ""},
		{"", ""},
		{"  Bottom 10th  ", "Bottom"},
	}
	for _, c := range cases {
		if got := inningHalf(c.detail); got != c.want {
			t.Errorf("inningHalf(%q) = %q, want %q", c.detail, got, c.want)
		}
	}
}

func TestParseMLBEventSituation(t *testing.T) {
	e := espnEvent{
		ID:   "401",
		Date: "2026-05-29T00:00Z",
		Competitions: []espnCompetition{{
			Status: espnStatus{
				Type:   espnStatusType{State: "in", Detail: "Bottom 7th"},
				Period: 7,
			},
			Situation: &espnSituation{
				Balls: 2, Strikes: 1, Outs: 2,
				OnFirst: true, OnThird: true,
			},
			Competitors: []espnCompetitor{
				{HomeAway: "home", Score: "5", Team: espnTeam{ID: "16", Abbreviation: "CHC"}},
				{HomeAway: "away", Score: "3", Team: espnTeam{ID: "8", Abbreviation: "MIL"}},
			},
		}},
	}
	snap, ok := parseMLBEvent(e)
	if !ok {
		t.Fatal("parseMLBEvent returned ok=false")
	}
	if snap.League != "mlb" {
		t.Errorf("League = %q, want \"mlb\"", snap.League)
	}
	if snap.State != StateLive {
		t.Errorf("State = %v, want StateLive", snap.State)
	}
	if snap.InningHalf != "Bottom" {
		t.Errorf("InningHalf = %q, want \"Bottom\"", snap.InningHalf)
	}
	if snap.Balls != 2 || snap.Strikes != 1 || snap.Outs != 2 {
		t.Errorf("count = %d-%d, %d outs; want 2-1, 2 outs", snap.Balls, snap.Strikes, snap.Outs)
	}
	if !snap.OnFirst || snap.OnSecond || !snap.OnThird {
		t.Errorf("bases = 1:%t 2:%t 3:%t; want first+third only", snap.OnFirst, snap.OnSecond, snap.OnThird)
	}
	if snap.Home.Abbr != "CHC" || snap.Away.Abbr != "MIL" {
		t.Errorf("teams = %s@%s, want MIL@CHC", snap.Away.Abbr, snap.Home.Abbr)
	}
}

// A pre-game event has no situation block; the pointer stays nil and the count
// and bases must be zero/false without panicking.
func TestParseMLBEventNoSituation(t *testing.T) {
	e := espnEvent{
		ID:   "402",
		Date: "2026-05-29T20:10Z",
		Competitions: []espnCompetition{{
			Status: espnStatus{Type: espnStatusType{State: "pre", Detail: "Scheduled"}},
			Competitors: []espnCompetitor{
				{HomeAway: "home", Score: "0", Team: espnTeam{ID: "16", Abbreviation: "CHC"}},
				{HomeAway: "away", Score: "0", Team: espnTeam{ID: "8", Abbreviation: "MIL"}},
			},
		}},
	}
	snap, ok := parseMLBEvent(e)
	if !ok {
		t.Fatal("parseMLBEvent returned ok=false")
	}
	if snap.State != StatePre {
		t.Errorf("State = %v, want StatePre", snap.State)
	}
	if snap.Balls != 0 || snap.Strikes != 0 || snap.Outs != 0 {
		t.Errorf("expected zero count pre-game, got %d-%d %d", snap.Balls, snap.Strikes, snap.Outs)
	}
	if snap.OnFirst || snap.OnSecond || snap.OnThird {
		t.Error("expected empty bases pre-game")
	}
}
