package scenes

import (
	"testing"

	"github.com/stevebargelt/pixtron/go-scoreboard/internal/sports"
)

func TestBaseballStatusLine(t *testing.T) {
	tests := []struct {
		name string
		game sports.GameSnapshot
		want string
	}{
		{
			name: "prefers ESPN inning detail",
			game: sports.GameSnapshot{StatusDetail: "Top 9th", InningHalf: "Top", Period: 9},
			want: "Top 9th",
		},
		{
			name: "trims surrounding whitespace",
			game: sports.GameSnapshot{StatusDetail: "  Bottom 3rd  "},
			want: "Bottom 3rd",
		},
		{
			name: "falls back to half and inning number",
			game: sports.GameSnapshot{InningHalf: "Bottom", Period: 7},
			want: "Bottom 7",
		},
		{
			name: "falls back to placeholder half when unknown",
			game: sports.GameSnapshot{Period: 4},
			want: "Inn 4",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := baseballStatusLine(tt.game); got != tt.want {
				t.Errorf("baseballStatusLine() = %q, want %q", got, tt.want)
			}
		})
	}
}
