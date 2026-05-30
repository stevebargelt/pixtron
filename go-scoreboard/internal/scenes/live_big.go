package scenes

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"time"

	xdraw "golang.org/x/image/draw"
	"golang.org/x/image/font"

	"github.com/stevebargelt/pixtron/go-scoreboard/internal/render"
	"github.com/stevebargelt/pixtron/go-scoreboard/internal/sports"
)

type LiveBig struct {
	Game      sports.GameSnapshot
	AssetsDir string
}

func (lb LiveBig) Render(width, height int, _ time.Time) *image.RGBA {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.Draw(img, img.Bounds(), image.NewUniform(color.Black), image.Point{}, draw.Src)

	smallFace, err := render.Face(render.Font04B03, 8)
	if err != nil {
		return img
	}
	scoreFace, err := render.Face(render.Font04B24, 16)
	if err != nil {
		return img
	}

	statusColor := color.RGBA{R: 0, G: 220, B: 0, A: 255} // green, matches the stacked scene
	abbrColor := color.RGBA{R: 220, G: 220, B: 220, A: 255}
	scoreColor := color.RGBA{R: 255, G: 255, B: 255, A: 255}

	// Layout (hand-designed, 64x32): 20x20 logos in the top corners, scores
	// centered below each logo, team abbreviations stacked vertically flanking
	// the center, and a two-line period/clock at top-center.
	const logoW, logoH = 20, 20

	// Logos: top corners.
	pasteLogo(img, render.Logo(lb.AssetsDir, lb.Game.Away.ID, render.LogoBanner), 0, 0, logoW, logoH)
	pasteLogo(img, render.Logo(lb.AssetsDir, lb.Game.Home.ID, render.LogoBanner), width-logoW, 0, logoW, logoH)

	// Scores: centered under each logo (logo centers are logoW/2 from each edge),
	// baseline at row 30 so the 10px-tall digits fill rows 21-30. Tracked to 1px
	// between digits so a 3-digit score fits an 18px-wide box.
	render.DrawTextTracked(img, fmt.Sprintf("%d", lb.Game.Away.Score), scoreFace, scoreColor, logoW/2, 31, render.AlignCenter, -1)
	render.DrawTextTracked(img, fmt.Sprintf("%d", lb.Game.Home.Score), scoreFace, scoreColor, width-logoW/2, 31, render.AlignCenter, -1)

	// Abbreviations: vertical stacks flanking the center channel. Letters are
	// 5px tall; baselines at 19/25/31 fill rows 15-31.
	drawVertical(img, lb.Game.Away.Abbr, smallFace, abbrColor, 23, 19, 6)
	drawVertical(img, lb.Game.Home.Abbr, smallFace, abbrColor, width-24, 19, 6)

	// Period + clock: two centered lines at top-center, in green.
	line1, line2 := statusTwoLines(lb.Game)
	render.DrawText(img, line1, smallFace, statusColor, width/2, 5, render.AlignCenter)
	render.DrawText(img, line2, smallFace, statusColor, width/2, 12, render.AlignCenter)

	return img
}

// drawVertical renders each rune of s centered at cx, stacked top-to-bottom with
// the first baseline at y0 and step pixels between successive baselines.
func drawVertical(dst *image.RGBA, s string, face font.Face, col color.Color, cx, y0, step int) {
	y := y0
	for _, r := range s {
		render.DrawText(dst, string(r), face, col, cx, y, render.AlignCenter)
		y += step
	}
}

func pasteLogo(dst *image.RGBA, src image.Image, x, y, w, h int) {
	if src == nil {
		return
	}
	if src.Bounds().Dx() == w && src.Bounds().Dy() == h {
		draw.Draw(dst, image.Rect(x, y, x+w, y+h), src, image.Point{}, draw.Over)
		return
	}
	scaled := image.NewRGBA(image.Rect(0, 0, w, h))
	xdraw.BiLinear.Scale(scaled, scaled.Bounds(), src, src.Bounds(), xdraw.Over, nil)
	draw.Draw(dst, image.Rect(x, y, x+w, y+h), scaled, image.Point{}, draw.Over)
}
