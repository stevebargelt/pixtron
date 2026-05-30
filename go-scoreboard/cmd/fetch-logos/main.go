// Command fetch-logos generates the resized mini (10x10) and banner (20x20) PNG
// logo variants used by the scoreboard, written to assets/logos/variants named
// by team ID (matching the IDs the sports feeds report).
//
// WNBA (default) downloads full-color logos from ESPN. NHL reuses the full-color
// source PNGs under assets/nhl_logos/<TRICODE>.png and maps each tricode to the
// numeric team ID the NHL score feed uses, so the variants line up with the IDs
// parseNHLGame produces. Run from the go-scoreboard directory:
//
//	go run ./cmd/fetch-logos --assets-dir ../assets            # WNBA
//	go run ./cmd/fetch-logos --assets-dir ../assets --league nhl
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"image"
	"image/png"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	xdraw "golang.org/x/image/draw"
)

const espnLogoTmpl = "https://a.espncdn.com/i/teamlogos/wnba/500/%s.png"

type team struct {
	ID   string `json:"id"`
	Abbr string `json:"abbr"`
}

type teamsFile struct {
	Teams []team `json:"teams"`
}

func main() {
	assetsDir := flag.String("assets-dir", "../assets", "path to assets directory")
	league := flag.String("league", "wnba", "league to generate variants for (wnba|nhl)")
	flag.Parse()

	switch strings.ToLower(*league) {
	case "wnba":
		runWNBA(*assetsDir)
	case "nhl":
		runNHL(*assetsDir)
	default:
		fail("unknown league %q (want wnba or nhl)", *league)
	}
}

func runWNBA(assetsDir string) {
	teamsPath := filepath.Join(assetsDir, "wnba_teams.json")
	raw, err := os.ReadFile(teamsPath)
	if err != nil {
		fail("read %s: %v", teamsPath, err)
	}
	var tf teamsFile
	if err := json.Unmarshal(raw, &tf); err != nil {
		fail("parse %s: %v", teamsPath, err)
	}

	variantsDir := ensureVariantsDir(assetsDir)
	client := &http.Client{Timeout: 20 * time.Second}
	ok, skipped := 0, 0
	for _, t := range tf.Teams {
		src, err := download(client, fmt.Sprintf(espnLogoTmpl, strings.ToLower(t.Abbr)))
		if err != nil {
			fmt.Printf("  %-4s %-3s SKIP: %v\n", t.Abbr, t.ID, err)
			skipped++
			continue
		}
		writeBoth(src, variantsDir, t.ID)
		fmt.Printf("  %-4s %-3s OK\n", t.Abbr, t.ID)
		ok++
	}
	fmt.Printf("Done: %d updated, %d skipped\n", ok, skipped)
}

func runNHL(assetsDir string) {
	srcDir := filepath.Join(assetsDir, "nhl_logos")
	entries, err := os.ReadDir(srcDir)
	if err != nil {
		fail("read %s: %v (NHL source logos live only on the device)", srcDir, err)
	}

	idByTri := nhlIDMap()
	if len(idByTri) == 0 {
		fail("could not resolve any tricode->id from the NHL score feed")
	}

	variantsDir := ensureVariantsDir(assetsDir)
	ok, skipped := 0, 0
	for _, e := range entries {
		if e.IsDir() || !strings.EqualFold(filepath.Ext(e.Name()), ".png") {
			continue
		}
		tri := strings.TrimSuffix(e.Name(), filepath.Ext(e.Name()))
		id, found := idByTri[strings.ToUpper(tri)]
		if !found {
			fmt.Printf("  %-4s     SKIP: no current team id in score feed\n", tri)
			skipped++
			continue
		}
		src, err := decodeFile(filepath.Join(srcDir, e.Name()))
		if err != nil {
			fmt.Printf("  %-4s %-3d SKIP: %v\n", tri, id, err)
			skipped++
			continue
		}
		writeBoth(src, variantsDir, fmt.Sprintf("%d", id))
		fmt.Printf("  %-4s %-3d OK\n", tri, id)
		ok++
	}
	fmt.Printf("Done: %d updated, %d skipped\n", ok, skipped)
}

// nhlIDMap collects tricode->numeric team id from recent NHL score feeds — the
// same source parseNHLGame reads — so the variant filenames match the IDs the
// app uses. Only currently-active teams appear, which sidesteps the franchise
// tricode collisions (e.g. UTA) in the static team list.
func nhlIDMap() map[string]int {
	type scoreTeam struct {
		ID     int    `json:"id"`
		Abbrev string `json:"abbrev"`
	}
	type scoreResp struct {
		Games []struct {
			HomeTeam scoreTeam `json:"homeTeam"`
			AwayTeam scoreTeam `json:"awayTeam"`
		} `json:"games"`
	}

	client := &http.Client{Timeout: 20 * time.Second}
	out := map[string]int{}
	day := time.Now()
	for i := 0; i < 14 && len(out) < 32; i++ {
		url := "https://api-web.nhle.com/v1/score/" + day.AddDate(0, 0, -i).Format("2006-01-02")
		resp, err := client.Get(url)
		if err != nil {
			continue
		}
		var parsed scoreResp
		err = json.NewDecoder(resp.Body).Decode(&parsed)
		resp.Body.Close()
		if err != nil {
			continue
		}
		for _, g := range parsed.Games {
			for _, t := range []scoreTeam{g.HomeTeam, g.AwayTeam} {
				if t.Abbrev != "" && t.ID != 0 {
					out[strings.ToUpper(t.Abbrev)] = t.ID
				}
			}
		}
	}
	return out
}

func ensureVariantsDir(assetsDir string) string {
	dir := filepath.Join(assetsDir, "logos", "variants")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		fail("mkdir %s: %v", dir, err)
	}
	return dir
}

func writeBoth(src image.Image, variantsDir, id string) {
	if err := writeVariant(src, filepath.Join(variantsDir, id+"_mini.png"), 10); err != nil {
		fail("write mini %s: %v", id, err)
	}
	if err := writeVariant(src, filepath.Join(variantsDir, id+"_banner.png"), 20); err != nil {
		fail("write banner %s: %v", id, err)
	}
}

func download(client *http.Client, url string) (image.Image, error) {
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}
	return png.Decode(resp.Body)
}

func decodeFile(path string) (image.Image, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return png.Decode(f)
}

// contentBounds returns the bounding box of the logo's actual mark, trimming
// surrounding margin — transparent pixels (WNBA's alpha PNGs) and near-white
// pixels (NHL's white-background PNGs). Only fully-background edges are trimmed;
// interior white is kept because the surrounding colored pixels set the box.
func contentBounds(img image.Image) image.Rectangle {
	b := img.Bounds()
	bg := func(x, y int) bool {
		r, g, bl, a := img.At(x, y).RGBA()
		if a < 0x4000 { // mostly transparent
			return true
		}
		return r > 0xE000 && g > 0xE000 && bl > 0xE000 // near-white
	}
	minX, minY := b.Max.X, b.Max.Y
	maxX, maxY := b.Min.X-1, b.Min.Y-1
	for y := b.Min.Y; y < b.Max.Y; y++ {
		for x := b.Min.X; x < b.Max.X; x++ {
			if bg(x, y) {
				continue
			}
			if x < minX {
				minX = x
			}
			if x > maxX {
				maxX = x
			}
			if y < minY {
				minY = y
			}
			if y > maxY {
				maxY = y
			}
		}
	}
	if maxX < minX || maxY < minY {
		return b // entirely background; fall back to the full image
	}
	return image.Rect(minX, minY, maxX+1, maxY+1)
}

// writeVariant trims the source margin then fits the mark into a size x size
// transparent canvas preserving aspect ratio (letterboxing wide logos), so the
// square slots the renderer uses are filled rather than padded.
func writeVariant(src image.Image, path string, size int) error {
	sb := contentBounds(src)
	sw, sh := sb.Dx(), sb.Dy()
	if sw <= 0 || sh <= 0 {
		return fmt.Errorf("empty source image")
	}
	scale := math.Min(float64(size)/float64(sw), float64(size)/float64(sh))
	dw := int(math.Max(1, math.Round(float64(sw)*scale)))
	dh := int(math.Max(1, math.Round(float64(sh)*scale)))
	offX := (size - dw) / 2
	offY := (size - dh) / 2

	dst := image.NewRGBA(image.Rect(0, 0, size, size))
	xdraw.CatmullRom.Scale(dst, image.Rect(offX, offY, offX+dw, offY+dh), src, sb, xdraw.Over, nil)

	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return png.Encode(f, dst)
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
