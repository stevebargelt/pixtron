package main

import (
	"testing"

	"github.com/stevebargelt/pixtron/go-scoreboard/internal/sports"
)

// TestFetchNBACallable is a compile-time integration check: sports.FetchNBA
// must satisfy the sports.LeagueFetcher signature used by the --fetch-nba code
// path in main.go. If the signature ever diverges the assignment fails to
// compile, catching the wiring break before the binary ships.
func TestFetchNBACallable(t *testing.T) {
	var _ sports.LeagueFetcher = sports.FetchNBA
}

// TestNewAppStateNBADemoLeague verifies that when "nba" is included in the
// --demo-leagues list, reloadConfig populates the app league list with "nba".
// This exercises the same demoLeagues→leagues pipeline used during --fetch-nba
// startup and confirms the NBA league code is routed through the app state.
func TestNewAppStateNBADemoLeague(t *testing.T) {
	s := newAppState("/tmp/assets", "nba,wnba")
	s.reloadConfig()

	s.mu.RLock()
	leagues := append([]string{}, s.leagues...)
	s.mu.RUnlock()

	found := false
	for _, l := range leagues {
		if l == "nba" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf(`expected "nba" in app state leagues after reloadConfig with demoLeagues="nba,wnba", got %v`, leagues)
	}
}
