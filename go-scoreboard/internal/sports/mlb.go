package sports

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const mlbScoreboardURL = "http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"

func FetchMLB(ctx context.Context, day time.Time) ([]GameSnapshot, error) {
	url := mlbScoreboardURL + "?dates=" + day.Format("20060102")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("mlb fetch: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("mlb fetch: status %d", resp.StatusCode)
	}

	var parsed struct {
		Events []espnEvent `json:"events"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("mlb decode: %w", err)
	}

	out := make([]GameSnapshot, 0, len(parsed.Events))
	for _, e := range parsed.Events {
		if s, ok := parseMLBEvent(e); ok {
			out = append(out, s)
		}
	}
	return out, nil
}

// espnSituation is the baseball-only live state ESPN nests on a competition. The
// pointer on espnCompetition is nil for leagues that don't report it.
type espnSituation struct {
	Balls    int  `json:"balls"`
	Strikes  int  `json:"strikes"`
	Outs     int  `json:"outs"`
	OnFirst  bool `json:"onFirst"`
	OnSecond bool `json:"onSecond"`
	OnThird  bool `json:"onThird"`
}

// parseMLBEvent reuses the shared ESPN team/state parsing and augments it with
// the baseball-only inning half and live count/bases.
func parseMLBEvent(e espnEvent) (GameSnapshot, bool) {
	s, ok := parseEvent("mlb", e)
	if !ok {
		return GameSnapshot{}, false
	}
	c := e.Competitions[0]
	s.InningHalf = inningHalf(c.Status.Type.Detail)
	if sit := c.Situation; sit != nil {
		s.Balls = sit.Balls
		s.Strikes = sit.Strikes
		s.Outs = sit.Outs
		s.OnFirst = sit.OnFirst
		s.OnSecond = sit.OnSecond
		s.OnThird = sit.OnThird
	}
	return s, true
}

// inningHalf normalizes ESPN's leading half token from a status detail like
// "Top 9th" or "Bottom 3rd" to "Top"/"Bottom". ESPN also reports "Middle"/"End"
// between half-innings; those are folded to the half that just played ("Middle"
// after the top, "End" after the bottom) so the renderer only reasons about two
// halves. Returns "" when the detail carries no inning half (pre-game, final).
func inningHalf(detail string) string {
	fields := strings.Fields(strings.TrimSpace(detail))
	if len(fields) == 0 {
		return ""
	}
	switch strings.ToLower(fields[0]) {
	case "top", "middle", "mid":
		return "Top"
	case "bottom", "bot", "end":
		return "Bottom"
	}
	return ""
}
