package scenes

import (
	"testing"

	"github.com/stevebargelt/pixtron/go-scoreboard/internal/sports"
)

func TestBaseballInningTag(t *testing.T) {
	tests := []struct {
		name string
		game sports.GameSnapshot
		want string
	}{
		{
			name: "top half",
			game: sports.GameSnapshot{InningHalf: "Top", Period: 9},
			want: "T9",
		},
		{
			name: "bottom half",
			game: sports.GameSnapshot{InningHalf: "Bottom", Period: 3},
			want: "B3",
		},
		{
			name: "unknown half falls back to number only",
			game: sports.GameSnapshot{Period: 4},
			want: "4",
		},
		{
			name: "no inning yet",
			game: sports.GameSnapshot{InningHalf: "Top", Period: 0},
			want: "T",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := baseballInningTag(tt.game); got != tt.want {
				t.Errorf("baseballInningTag() = %q, want %q", got, tt.want)
			}
		})
	}
}
