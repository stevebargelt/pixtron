package render

import (
	"image"
	"image/color"

	"golang.org/x/image/font"
	"golang.org/x/image/math/fixed"
)

type Align int

const (
	AlignLeft Align = iota
	AlignCenter
	AlignRight
)

// DrawText renders s at (x, baselineY). For AlignCenter / AlignRight, x is
// the centerline / right edge respectively.
func DrawText(img *image.RGBA, s string, face font.Face, c color.Color, x, baselineY int, align Align) {
	w := font.MeasureString(face, s).Round()
	switch align {
	case AlignCenter:
		x -= w / 2
	case AlignRight:
		x -= w
	}
	d := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(c),
		Face: face,
		Dot:  fixed.Point26_6{X: fixed.I(x), Y: fixed.I(baselineY)},
	}
	d.DrawString(s)
}

// DrawTextTracked is like DrawText but adjusts the gap between glyphs by `extra`
// pixels (negative tightens). The default 04b glyph advances leave 2px between
// numerals; extra=-1 yields 1px, e.g. fitting a 3-digit score into 18px.
func DrawTextTracked(img *image.RGBA, s string, face font.Face, c color.Color, x, baselineY int, align Align, extra int) {
	runes := []rune(s)
	total := 0
	for i, r := range runes {
		a, _ := face.GlyphAdvance(r)
		total += a.Round()
		if i < len(runes)-1 {
			total += extra
		}
	}
	switch align {
	case AlignCenter:
		x -= total / 2
	case AlignRight:
		x -= total
	}
	d := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(c),
		Face: face,
		Dot:  fixed.Point26_6{X: fixed.I(x), Y: fixed.I(baselineY)},
	}
	for i, r := range runes {
		d.DrawString(string(r))
		if i < len(runes)-1 {
			d.Dot.X += fixed.I(extra)
		}
	}
}
