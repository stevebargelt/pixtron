package scenes

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"time"

	"github.com/stevebargelt/pixtron/go-scoreboard/internal/render"
	"github.com/stevebargelt/pixtron/go-scoreboard/internal/sports"
)

// LiveBaseball renders a live MLB game. Baseball needs an inning half (Top/Bottom)
// the generic Live scene's period/clock line can't express, so it gets a
// purpose-built scene. This slice draws two team rows plus an inning status line;
// the balls/strikes/outs count and base-runner diamond land in a follow-up.
type LiveBaseball struct {
	Game      sports.GameSnapshot
	AssetsDir string
}

func (l LiveBaseball) Render(width, height int, _ time.Time) *image.RGBA {
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

	abbrColor := color.RGBA{R: 200, G: 200, B: 200, A: 255}
	scoreColor := color.RGBA{R: 255, G: 255, B: 255, A: 255}
	statusColor := color.RGBA{R: 0, G: 220, B: 0, A: 255}

	const (
		rowH        = 12
		topY        = 1
		logoX       = 1
		logoSize    = 10
		abbrX       = 13
		abbrBaseDy  = 8
		scoreBaseDy = 10
	)
	botY := topY + rowH
	scoreRightX := width - 1

	drawRow := func(team sports.Team, rowY int) {
		if logo := render.Logo(l.AssetsDir, team.ID, render.LogoMini); logo != nil {
			pasteLogo(img, logo, logoX, rowY, logoSize, logoSize)
		} else {
			placeholder := color.RGBA{R: 80, G: 80, B: 80, A: 255}
			for y := rowY; y < rowY+logoSize; y++ {
				img.Set(logoX, y, placeholder)
				img.Set(logoX+logoSize-1, y, placeholder)
			}
			for x := logoX; x < logoX+logoSize; x++ {
				img.Set(x, rowY, placeholder)
				img.Set(x, rowY+logoSize-1, placeholder)
			}
		}
		abbr := team.Abbr
		if len(abbr) > 4 {
			abbr = abbr[:4]
		}
		render.DrawText(img, abbr, smallFace, abbrColor, abbrX, rowY+abbrBaseDy, render.AlignLeft)
		render.DrawText(img, fmt.Sprintf("%d", team.Score), scoreFace, scoreColor, scoreRightX, rowY+scoreBaseDy, render.AlignRight)
	}

	drawRow(l.Game.Away, topY)
	drawRow(l.Game.Home, botY)

	// Bottom band (y 24..31): inning arrow + number (left), base-runner diamond
	// (center), count + outs (right). The arrow, diamond and dots are raw pixels so
	// they don't bloom the way condensed font glyphs do on the panel.
	switch l.Game.InningHalf {
	case "Top":
		drawHalfArrow(img, 1, 27, true, statusColor)
	case "Bottom":
		drawHalfArrow(img, 1, 27, false, statusColor)
	}
	if l.Game.Period > 0 {
		render.DrawText(img, fmt.Sprintf("%d", l.Game.Period), smallFace, statusColor, 8, height-2, render.AlignLeft)
	}
	drawBaseDiamond(img, l.Game, 22, 24)
	render.DrawText(img, fmt.Sprintf("%d-%d", l.Game.Balls, l.Game.Strikes), smallFace, scoreColor, 38, height-2, render.AlignLeft)
	drawOuts(img, l.Game.Outs, 53, 25)

	return img
}

// drawHalfArrow draws a 5x3 triangle at the top-left origin (x,y): apex up marks
// the top of an inning, apex down the bottom.
func drawHalfArrow(img *image.RGBA, x, y int, top bool, c color.RGBA) {
	set := func(px, py int) { img.Set(px, py, c) }
	if top {
		set(x+2, y)
		set(x+1, y+1)
		set(x+2, y+1)
		set(x+3, y+1)
		for dx := 0; dx < 5; dx++ {
			set(x+dx, y+2)
		}
		return
	}
	for dx := 0; dx < 5; dx++ {
		set(x+dx, y)
	}
	set(x+1, y+1)
	set(x+2, y+1)
	set(x+3, y+1)
	set(x+2, y+2)
}

// drawBaseDiamond renders the three bases as 3x3 squares in a diamond at the given
// top-left origin: 2nd top-center, 3rd lower-left, 1st lower-right. Occupied bases
// are filled amber; empty bases are a dim outline.
func drawBaseDiamond(img *image.RGBA, g sports.GameSnapshot, x, y int) {
	drawBase(img, x+3, y, g.OnSecond) // 2nd: top-center
	drawBase(img, x, y+3, g.OnThird)  // 3rd: lower-left
	drawBase(img, x+6, y+3, g.OnFirst) // 1st: lower-right
}

func drawBase(img *image.RGBA, x, y int, occupied bool) {
	on := color.RGBA{R: 255, G: 200, B: 0, A: 255}
	off := color.RGBA{R: 70, G: 70, B: 70, A: 255}
	const size = 3
	for dy := 0; dy < size; dy++ {
		for dx := 0; dx < size; dx++ {
			edge := dx == 0 || dy == 0 || dx == size-1 || dy == size-1
			if occupied {
				img.Set(x+dx, y+dy, on)
			} else if edge {
				img.Set(x+dx, y+dy, off)
			}
		}
	}
}

// drawOuts renders two 3x3 dots; the first `outs` of them are filled red (an out
// recorded), the rest dim. Outs run 0..2 — a third out ends the half-inning.
func drawOuts(img *image.RGBA, outs, x, y int) {
	on := color.RGBA{R: 220, G: 40, B: 40, A: 255}
	off := color.RGBA{R: 70, G: 70, B: 70, A: 255}
	const size = 3
	for i := 0; i < 2; i++ {
		col := off
		if i < outs {
			col = on
		}
		ox := x + i*5
		for dy := 0; dy < size; dy++ {
			for dx := 0; dx < size; dx++ {
				img.Set(ox+dx, y+dy, col)
			}
		}
	}
}
