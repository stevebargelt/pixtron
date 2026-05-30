package scenes

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"time"

	xdraw "golang.org/x/image/draw"

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
	scoreFace, err := render.Face(render.FontScoreLarge, 16)
	if err != nil {
		return img
	}

	statusColor := color.RGBA{R: 0, G: 220, B: 0, A: 255} // green, matches the stacked scene
	abbrColor := color.RGBA{R: 220, G: 220, B: 220, A: 255}
	scoreColor := color.RGBA{R: 255, G: 255, B: 255, A: 255}

	const (
		logoW = 16
		logoH = 16
		logoY = 1
		abbrY = 24
	)
	awayLogoLeft := 1
	homeLogoLeft := width - logoW - 1

	// Away on the left, home on the right (away @ home).
	pasteLogo(img, render.Logo(lb.AssetsDir, lb.Game.Away.ID, render.LogoBanner), awayLogoLeft, logoY, logoW, logoH)
	pasteLogo(img, render.Logo(lb.AssetsDir, lb.Game.Home.ID, render.LogoBanner), homeLogoLeft, logoY, logoW, logoH)

	render.DrawText(img, lb.Game.Away.Abbr, smallFace, abbrColor, awayLogoLeft+logoW/2, abbrY, render.AlignCenter)
	render.DrawText(img, lb.Game.Home.Abbr, smallFace, abbrColor, homeLogoLeft+logoW/2, abbrY, render.AlignCenter)

	// Scores, larger, in the wide center gap between the logos.
	mid := width / 2
	render.DrawText(img, fmt.Sprintf("%d", lb.Game.Away.Score), scoreFace, scoreColor, mid-2, 14, render.AlignRight)
	render.DrawText(img, fmt.Sprintf("%d", lb.Game.Home.Score), scoreFace, scoreColor, mid+2, 14, render.AlignLeft)

	// Period + clock at the bottom in green, matching the stacked scene.
	render.DrawText(img, statusLine(lb.Game), smallFace, statusColor, width/2, height-1, render.AlignCenter)

	return img
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
