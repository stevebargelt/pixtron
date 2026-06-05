package sports

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// TestFetcherNBARegistered verifies the aggregator registry maps "nba" to a
// non-nil LeagueFetcher. The registry wiring in aggregator.go is the integration
// point between the NBA fetcher and the multi-league dispatch path.
func TestFetcherNBARegistered(t *testing.T) {
	if Fetcher("nba") == nil {
		t.Fatal(`Fetcher("nba") returned nil — nba is not registered in aggregator.go`)
	}
}

// TestFetchAllNBADispatch verifies FetchAll routes "nba" through the registry to
// FetchNBA rather than returning an unknownLeagueError. A pre-cancelled context
// causes the HTTP request to fail immediately; the error type distinguishes a
// dispatch failure (context/network) from a routing gap (unknownLeagueError).
func TestFetchAllNBADispatch(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, failures := FetchAll(ctx, time.Date(2026, 6, 5, 0, 0, 0, 0, time.UTC), []string{"nba"})
	err, exists := failures["nba"]
	if !exists {
		// HTTP call succeeded despite cancelled context — dispatch is wired; pass.
		return
	}
	if _, isUnknown := err.(unknownLeagueError); isUnknown {
		t.Errorf(`FetchAll(["nba"]) returned unknownLeagueError — "nba" is not in the registry: %v`, err)
	}
}

// TestFetchNBAEndToEnd exercises the full FetchNBA HTTP→JSON-decode→parseEvent
// pipeline using a local fixture server. It verifies the NBA endpoint is reached
// and that the JSON response is parsed correctly into GameSnapshot values.
func TestFetchNBAEndToEnd(t *testing.T) {
	const fixture = `{
		"events": [
			{
				"id": "501",
				"date": "2026-06-05T23:00Z",
				"competitions": [{
					"status": {
						"type": {"state": "in", "completed": false, "detail": "3rd Quarter"},
						"period": 3,
						"displayClock": "4:32"
					},
					"competitors": [
						{"homeAway": "home", "score": "78", "team": {"id": "13", "displayName": "Miami Heat", "abbreviation": "MIA"}},
						{"homeAway": "away", "score": "82", "team": {"id": "15", "displayName": "Boston Celtics", "abbreviation": "BOS"}}
					]
				}]
			}
		]
	}`

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(fixture))
	}))
	defer srv.Close()

	origTransport := http.DefaultClient.Transport
	http.DefaultClient.Transport = &hostRedirectTransport{
		target: strings.TrimPrefix(srv.URL, "http://"),
		orig:   origTransport,
	}
	t.Cleanup(func() { http.DefaultClient.Transport = origTransport })

	games, err := FetchNBA(context.Background(), time.Date(2026, 6, 5, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("FetchNBA returned unexpected error: %v", err)
	}
	if len(games) != 1 {
		t.Fatalf("expected 1 game, got %d", len(games))
	}
	g := games[0]
	if g.League != "nba" {
		t.Errorf("League = %q, want \"nba\"", g.League)
	}
	if g.State != StateLive {
		t.Errorf("State = %v, want StateLive", g.State)
	}
	if g.Period != 3 || g.DisplayClock != "4:32" {
		t.Errorf("period/clock = %d/%s, want 3/4:32", g.Period, g.DisplayClock)
	}
	if g.Home.Abbr != "MIA" || g.Away.Abbr != "BOS" {
		t.Errorf("teams = %s@%s, want BOS@MIA", g.Away.Abbr, g.Home.Abbr)
	}
	if g.Home.Score != 78 || g.Away.Score != 82 {
		t.Errorf("score = home=%d away=%d, want home=78 away=82", g.Home.Score, g.Away.Score)
	}
}

// hostRedirectTransport rewrites every outbound HTTP request to a fixed
// target host:port, leaving the path and query intact. Used to redirect
// FetchNBA's hardcoded ESPN URL to a local fixture server in tests.
type hostRedirectTransport struct {
	target string // "127.0.0.1:PORT" — no scheme
	orig   http.RoundTripper
}

func (rt *hostRedirectTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	clone := req.Clone(req.Context())
	clone.URL.Scheme = "http"
	clone.URL.Host = rt.target
	tr := rt.orig
	if tr == nil {
		tr = http.DefaultTransport
	}
	return tr.RoundTrip(clone)
}
