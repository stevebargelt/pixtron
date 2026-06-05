package sports

import "testing"

func TestParseNBAEvent(t *testing.T) {
	e := espnEvent{
		ID:   "401",
		Date: "2026-06-05T23:00Z",
		Competitions: []espnCompetition{{
			Status: espnStatus{
				Type:         espnStatusType{State: "in", Detail: "3rd Quarter"},
				Period:       3,
				DisplayClock: "4:32",
			},
			Competitors: []espnCompetitor{
				{HomeAway: "home", Score: "78", Team: espnTeam{ID: "13", DisplayName: "Miami Heat", Abbreviation: "MIA"}},
				{HomeAway: "away", Score: "82", Team: espnTeam{ID: "15", DisplayName: "Boston Celtics", Abbreviation: "BOS"}},
			},
		}},
	}
	snap, ok := parseEvent("nba", e)
	if !ok {
		t.Fatal("parseEvent returned ok=false")
	}
	if snap.League != "nba" {
		t.Errorf("League = %q, want \"nba\"", snap.League)
	}
	if snap.State != StateLive {
		t.Errorf("State = %v, want StateLive", snap.State)
	}
	if snap.Period != 3 {
		t.Errorf("Period = %d, want 3", snap.Period)
	}
	if snap.DisplayClock != "4:32" {
		t.Errorf("DisplayClock = %q, want \"4:32\"", snap.DisplayClock)
	}
	if snap.Home.Abbr != "MIA" || snap.Away.Abbr != "BOS" {
		t.Errorf("teams = %s@%s, want BOS@MIA", snap.Away.Abbr, snap.Home.Abbr)
	}
	if snap.Home.Score != 78 || snap.Away.Score != 82 {
		t.Errorf("score = %d-%d, want 82-78", snap.Away.Score, snap.Home.Score)
	}
}

func TestParseNBAEventPregame(t *testing.T) {
	e := espnEvent{
		ID:   "402",
		Date: "2026-06-06T00:30Z",
		Competitions: []espnCompetition{{
			Status: espnStatus{
				Type: espnStatusType{State: "pre", Detail: "Scheduled"},
			},
			Competitors: []espnCompetitor{
				{HomeAway: "home", Score: "0", Team: espnTeam{ID: "13", DisplayName: "Miami Heat", Abbreviation: "MIA"}},
				{HomeAway: "away", Score: "0", Team: espnTeam{ID: "15", DisplayName: "Boston Celtics", Abbreviation: "BOS"}},
			},
		}},
	}
	snap, ok := parseEvent("nba", e)
	if !ok {
		t.Fatal("parseEvent returned ok=false")
	}
	if snap.State != StatePre {
		t.Errorf("State = %v, want StatePre", snap.State)
	}
	if snap.StartTime.IsZero() {
		t.Error("StartTime should not be zero for pregame event with valid date")
	}
	// NBA events have no baseball-specific fields
	if snap.InningHalf != "" || snap.Balls != 0 || snap.Strikes != 0 || snap.Outs != 0 {
		t.Error("NBA events must not carry baseball state")
	}
}

func TestParseNBAEventFinal(t *testing.T) {
	e := espnEvent{
		ID:   "403",
		Date: "2026-06-04T23:00Z",
		Competitions: []espnCompetition{{
			Status: espnStatus{
				Type: espnStatusType{State: "post", Completed: true, Detail: "Final"},
			},
			Competitors: []espnCompetitor{
				{HomeAway: "home", Score: "105", Team: espnTeam{ID: "13", DisplayName: "Miami Heat", Abbreviation: "MIA"}},
				{HomeAway: "away", Score: "110", Team: espnTeam{ID: "15", DisplayName: "Boston Celtics", Abbreviation: "BOS"}},
			},
		}},
	}
	snap, ok := parseEvent("nba", e)
	if !ok {
		t.Fatal("parseEvent returned ok=false")
	}
	if snap.State != StateFinal {
		t.Errorf("State = %v, want StateFinal", snap.State)
	}
}

func TestParseNBAEventMissingCompetition(t *testing.T) {
	e := espnEvent{ID: "404", Date: "2026-06-05T23:00Z"}
	_, ok := parseEvent("nba", e)
	if ok {
		t.Error("expected ok=false for event with no competitions")
	}
}

func TestParseNBAEventEspnDateFormat(t *testing.T) {
	// ESPN omits seconds — this must parse correctly via parseEventTime.
	e := espnEvent{
		ID:   "405",
		Date: "2026-06-05T00:00Z",
		Competitions: []espnCompetition{{
			Status: espnStatus{
				Type: espnStatusType{State: "pre", Detail: "Scheduled"},
			},
			Competitors: []espnCompetitor{
				{HomeAway: "home", Score: "0", Team: espnTeam{ID: "13", Abbreviation: "MIA"}},
				{HomeAway: "away", Score: "0", Team: espnTeam{ID: "15", Abbreviation: "BOS"}},
			},
		}},
	}
	snap, ok := parseEvent("nba", e)
	if !ok {
		t.Fatal("parseEvent returned ok=false")
	}
	if snap.StartTime.IsZero() {
		t.Error("StartTime is zero — parseEventTime failed to parse ESPN date without seconds")
	}
}
