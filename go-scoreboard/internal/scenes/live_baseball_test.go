package scenes

import (
	"image"
	"image/color"
	"testing"
)

// drawHalfArrow must point the apex up for the top of an inning and down for the
// bottom — the orientation is the whole point of the glyph.
func TestDrawHalfArrow(t *testing.T) {
	c := color.RGBA{R: 0, G: 220, B: 0, A: 255}
	isSet := func(img *image.RGBA, x, y int) bool {
		_, _, _, a := img.At(x, y).RGBA()
		return a > 0
	}

	top := image.NewRGBA(image.Rect(0, 0, 8, 8))
	drawHalfArrow(top, 0, 0, true, c)
	if !isSet(top, 2, 0) {
		t.Error("top arrow: apex pixel (2,0) should be set")
	}
	if isSet(top, 0, 0) || isSet(top, 4, 0) {
		t.Error("top arrow: top row corners should be empty (apex up)")
	}
	if !isSet(top, 0, 2) || !isSet(top, 4, 2) {
		t.Error("top arrow: base row should be full")
	}

	bot := image.NewRGBA(image.Rect(0, 0, 8, 8))
	drawHalfArrow(bot, 0, 0, false, c)
	if !isSet(bot, 0, 0) || !isSet(bot, 4, 0) {
		t.Error("bottom arrow: top row should be full (base up)")
	}
	if !isSet(bot, 2, 2) {
		t.Error("bottom arrow: apex pixel (2,2) should be set")
	}
	if isSet(bot, 0, 2) || isSet(bot, 4, 2) {
		t.Error("bottom arrow: bottom row corners should be empty (apex down)")
	}
}
