package render

import (
	"fmt"
	"image"
	"image/png"
	"os"
	"path/filepath"
	"sync"
)

type LogoVariant string

const (
	LogoMini   LogoVariant = "mini"
	LogoBanner LogoVariant = "banner"
)

type logoKey struct {
	league  string
	teamID  string
	variant LogoVariant
}

var (
	logoCache = map[logoKey]image.Image{}
	logoMu    sync.Mutex
)

// Logo returns the cached decoded image for a team, or nil if the file is missing.
// Variants are namespaced by league because team IDs are only unique within a
// league — e.g. id 8 is the WNBA Lynx, the NHL Canadiens, and the MLB Brewers —
// so a flat id-keyed file would collide across leagues.
func Logo(assetsDir, league, teamID string, variant LogoVariant) image.Image {
	k := logoKey{league, teamID, variant}
	logoMu.Lock()
	defer logoMu.Unlock()
	if img, ok := logoCache[k]; ok {
		return img
	}
	path := filepath.Join(assetsDir, "logos", "variants", league, fmt.Sprintf("%s_%s.png", teamID, variant))
	f, err := os.Open(path)
	if err != nil {
		logoCache[k] = nil
		return nil
	}
	defer f.Close()
	img, err := png.Decode(f)
	if err != nil {
		logoCache[k] = nil
		return nil
	}
	logoCache[k] = img
	return img
}
