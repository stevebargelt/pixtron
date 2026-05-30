package scenes

import (
	"testing"

	"github.com/stevebargelt/pixtron/go-scoreboard/internal/sports"
)

func TestStatusLine(t *testing.T) {
	tests := []struct {
		name string
		game sports.GameSnapshot
		want string
	}{
		{
			name: "in play shows period and clock",
			game: sports.GameSnapshot{Period: 2, DisplayClock: "12:34"},
			want: "2nd 12:34",
		},
		{
			name: "intermission keeps the countdown labeled with the period",
			game: sports.GameSnapshot{Period: 2, DisplayClock: "17:34", Intermission: true},
			want: "2nd Int 17:34",
		},
		{
			name: "first intermission labels with 1st",
			game: sports.GameSnapshot{Period: 1, DisplayClock: "16:02", Intermission: true},
			want: "1st Int 16:02",
		},
		{
			name: "intermission with unknown period falls back to Int",
			game: sports.GameSnapshot{Period: 0, DisplayClock: "17:34", Intermission: true},
			want: "Int 17:34",
		},
		{
			name: "halftime detail wins over period clock",
			game: sports.GameSnapshot{Period: 2, DisplayClock: "0.0", StatusDetail: "Halftime"},
			want: "Halftime",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := statusLine(tt.game); got != tt.want {
				t.Errorf("statusLine() = %q, want %q", got, tt.want)
			}
		})
	}
}
