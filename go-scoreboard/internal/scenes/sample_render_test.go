package scenes

import (
	"image/png"
	"os"
	"testing"
	"time"

	"github.com/stevebargelt/pixtron/go-scoreboard/internal/sports"
)

// TestRenderLiveBigSample renders a representative LiveBig frame to a PNG so the
// side-by-side layout can be eyeballed without waiting for a live game. Skipped
// unless RENDER_SAMPLE is set. On the device:
//
//	RENDER_SAMPLE=1 go test ./internal/scenes -run LiveBigSample
func TestRenderLiveBigSample(t *testing.T) {
	if os.Getenv("RENDER_SAMPLE") == "" {
		t.Skip("set RENDER_SAMPLE=1 to render the sample frame")
	}
	assets := os.Getenv("SAMPLE_ASSETS")
	if assets == "" {
		assets = "../../assets"
	}
	out := os.Getenv("SAMPLE_OUT")
	if out == "" {
		out = "/tmp/livebig_sample.png"
	}
	g := sports.GameSnapshot{
		League:       "wnba",
		State:        sports.StateLive,
		Away:         sports.Team{ID: "16", Abbr: "WSH", Score: 82},
		Home:         sports.Team{ID: "131935", Abbr: "TOR", Score: 54},
		Period:       4,
		DisplayClock: "3:26",
	}
	img := LiveBig{Game: g, AssetsDir: assets}.Render(64, 32, time.Time{})
	f, err := os.Create(out)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	if err := png.Encode(f, img); err != nil {
		t.Fatal(err)
	}
	t.Logf("wrote %s", out)
}
