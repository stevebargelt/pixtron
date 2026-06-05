package sports

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const nbaScoreboardURL = "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"

func FetchNBA(ctx context.Context, day time.Time) ([]GameSnapshot, error) {
	url := nbaScoreboardURL + "?dates=" + day.Format("20060102")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("nba fetch: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("nba fetch: status %d", resp.StatusCode)
	}

	var parsed struct {
		Events []espnEvent `json:"events"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("nba decode: %w", err)
	}

	out := make([]GameSnapshot, 0, len(parsed.Events))
	for _, e := range parsed.Events {
		if s, ok := parseEvent("nba", e); ok {
			out = append(out, s)
		}
	}
	return out, nil
}
