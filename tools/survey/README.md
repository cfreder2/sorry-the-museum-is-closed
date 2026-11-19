# Tracing tools

Small Python helpers used to read rooms off the architect's drawings. They need
Pillow, NumPy and SciPy. The drawings themselves are not in the repository;
`survey/README.md` says where each one is.

- `grid.py image x0,y0,x1,y1 out.png [step] [scale]` crops a drawing and lays a
  labelled pixel grid over it, so positions can be read off by eye.
- `seg.py` finds each colour-filled room on a plan and returns its rectangle in
  metres, given the palette and the pixel-to-metre mapping for that sheet.

How a sheet is tied to the ground: walls that appear both on the sheet and in
the map outline (`survey/outline.json`) fix its scale and position. For the
Modern Wing sheets that is 8.88 pixels a metre, with the west pavilion's
gallery wall at x = 152.1 and the east pavilion's north wall at z = −8.7. The
second-floor sheet is stretched 5 % east to west; it was corrected by making
its limestone ribs stand over the ground floor's.

Before anything is traced the map frame is turned 0.94° about (140, 110), so
the building's own grid lies along the axes.
