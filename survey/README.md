# Survey: what the true-to-scale building is drawn from

The museum in the game was first built from one point per gallery, grown into
squares on a single level. This folder is the start of replacing that with the
real building: real outline, real levels, real rooms.

`node tools/fetch_survey.mjs` writes the two data files here. Everything is in
the game's own frame: metres, x east, z south, same origin as before.

## What is measured

| Fact | Value | From |
|---|---|---|
| Ground covered by the museum (McKinlock Court taken out) | 25,931 m² (279,000 sq ft) | map outline |
| Extent of the outline | 246 m east to west, 246 m north to south | map outline |
| The building's grid against true north | turned 0.94° | long walls of the outline |
| Galleries on record with a position | 170: 12 lower level, 72 first, 73 second, 13 third | museum API |
| Galleries in the game today | 83, on one level, 17,960 m² of floor | `src/layout.js` |

The museum's published figure of about a million square feet is all floors
together, back-of-house included. 25,931 m² of ground under roughly three and a
half levels comes to about that, so the outline and the published figure agree.

## Data kept here

- `outline.json`: the museum's outline, McKinlock Court, the named parts the
  map records (Modern Wing, Arts of the Americas, Alsdorf Galleries, Rubloff
  Auditorium, Stock Exchange Trading Room, Fullerton Hall, the libraries, the
  shops), the railway and the streets. Map data © OpenStreetMap contributors,
  ODbL 1.0.
- `galleries.json`: every gallery the museum's API lists with a position:
  number, floor, whether it is closed, and where it is.

## Drawings (not kept here)

These are other people's drawings. They are read for measurements; the files
themselves are not in the repository.

| Drawing | Gives | Where |
|---|---|---|
| Renzo Piano Building Workshop, Modern Wing plans at ground, +1 and +2 | every wall, stair, lift and doorway of the Modern Wing on all three floors, at about 0.1 m a pixel | arquitecturaviva.com/works/ampliacion-del-instituto-de-arte-de-chicago-1 |
| RPBW, north-south section through the east pavilion | floor levels, ceiling heights, the basement, the roof canopy, Monroe Street and the garden levels | same page; also archdaily.com/24652 |
| RPBW, site plan of the whole block at ground level | the first-floor plan of every building: the 1893 block, the bridge over the railway, the east buildings round McKinlock Court, the auditoria | arquitecturaviva.com/works/ampliacion-del-instituto-de-arte-de-chicago-en-proyecto-2; uncropped at archdaily.com/24652 |
| RPBW, east and north elevations, façade detail with level marks | outside heights of the Modern Wing | same pages |
| The museum's visitor maps, lower level and floors 1 to 3 (3600 × 3300) | every gallery number, which rooms join, stairs, lifts, ramps, where buildings do and do not connect on each level | artic.edu/visit/explore-on-your-own/museum-floor-plan |
| First and second floor plans of 1900 | the original Michigan Avenue block, wall by wall (public domain) | Wikimedia Commons, "Art Institute of Chicago first/second floor plan 1900" |

## What is still not known

- **Second floor and lower level of the older buildings.** No architect's plan
  later than 1900 has been found. These come from the visitor maps, pinned to
  the outline and to the API's gallery positions: right to a metre or two, not
  to a wall's thickness.
- **Heights in the older buildings.** No section has been found. They will be
  taken from photographs and from the count of steps on the Grand Staircase.
- **Back-of-house.** Offices, stores, conservation and plant are on no public
  drawing. They are solid.
- **The 1900 plans** could not be downloaded when this was written (Wikimedia
  was refusing requests).
