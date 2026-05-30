package scenes

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"strings"
	"time"

	"github.com/stevebargelt/pixtron/go-scoreboard/internal/render"
	"github.com/stevebargelt/pixtron/go-scoreboard/internal/sports"
)

type Live struct {
	Game      sports.GameSnapshot
	AssetsDir string
}

func (l Live) Render(width, height int, _ time.Time) *image.RGBA {
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
			// Scale (don't crop) the variant into the square slot so non-10x10
			// source art renders whole and aspect-correct.
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

	render.DrawText(img, statusLine(l.Game), smallFace, statusColor, width/2, height-1, render.AlignCenter)

	return img
}

// statusLine builds the bottom status text for a live game. It prefers ESPN's
// human-readable detail for intermission states (e.g. Halftime) and otherwise
// shows the period name plus the game clock.
func statusLine(g sports.GameSnapshot) string {
	if strings.EqualFold(strings.TrimSpace(g.StatusDetail), "halftime") {
		return "Halftime"
	}
	// During an intermission the clock reports the intermission countdown, not
	// the game clock, while the period still reads the period that just ended.
	// Keep the countdown but label it with that period (e.g. "Int 2 17:34")
	// so it isn't mistaken for game time.
	if g.Intermission {
		if g.Period > 0 {
			return strings.TrimSpace(fmt.Sprintf("Int %d %s", g.Period, g.DisplayClock))
		}
		return strings.TrimSpace("Int " + g.DisplayClock)
	}
	return strings.TrimSpace(periodName(g.Period) + " " + g.DisplayClock)
}

// statusTwoLines splits the live status into a period line and a clock line for
// the LiveBig layout (period top, clock below).
func statusTwoLines(g sports.GameSnapshot) (string, string) {
	if strings.EqualFold(strings.TrimSpace(g.StatusDetail), "halftime") {
		return "Half", "time"
	}
	if g.Intermission {
		if g.Period > 0 {
			return fmt.Sprintf("Int %d", g.Period), strings.TrimSpace(g.DisplayClock)
		}
		return "Int", strings.TrimSpace(g.DisplayClock)
	}
	return periodName(g.Period), strings.TrimSpace(g.DisplayClock)
}

func periodName(period int) string {
	switch period {
	case 0:
		return ""
	case 1:
		return "1st"
	case 2:
		return "2nd"
	case 3:
		return "3rd"
	case 4:
		return "4th"
	}
	if period == 5 {
		return "OT"
	}
	return fmt.Sprintf("OT%d", period-4)
}
