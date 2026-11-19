#!/usr/bin/env python3
"""Fills the parts of the building no public drawing shows.

    python3 tools/survey/back_of_house.py        writes survey/back-of-house.json

On each level, whatever lies inside the map outline and is not a traced room is back-of-house. It
is cut into rooms of ordinary working sizes off a service corridor, and each room is given a use.
The uses are ASSUMED. What is known is only which building does what (see BASIS); which room is
which is a reasonable guess at how a museum of this size is run, nothing more.
"""
import json, math, os
import numpy as np, cv2

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'survey')
A = math.radians(0.94)
def rot(p):
    x, z = p[0] - 140, p[1] - 110
    return (140 + x * math.cos(A) - z * math.sin(A), 110 + x * math.sin(A) + z * math.cos(A))

BASIS = {
 'ferguson': 'Ferguson Memorial Building (Holabird & Root & Burgee, 1958): built for the museum\'s administration.',
 'allerton': 'Allerton Building (Shepley, Rutan and Coolidge, 1893): the libraries and the prints and drawings department have always been here.',
 'morton':   'Morton Wing (Shaw, Metz & Associates, 1962).',
 'rice':     'Rice Building (Hammond, Beeby & Babka, 1988): "exhibition and storage facilities for four curatorial departments".',
 'columbus': 'Columbus Drive addition (Skidmore, Owings & Merrill, 1977): the auditorium, the Stock Exchange Trading Room, the school, and the service side of the museum.',
 'east':     'The buildings round McKinlock Court (1920s), east of the railway.',
 'conservation': 'The museum has five conservation laboratories (paintings, paper, objects, textiles, photographs) and cold storage for 24,000 photographs; their rooms are not published.',
}
# zone: (x0, x1, z0, z1), basis, levels it exists on, and what goes there on each level, in walking order
ZONES = [
 ('ferguson', (72, 90.5, -4, 100.9), ['LL', '1', '2', '3'], {
   'LL': ['Staff entrance and security desk', 'Security control room', 'Mail room', 'Staff lockers', 'Uniform store', 'Staff canteen', 'Canteen kitchen', 'Building engineers', 'Boiler room', 'Chiller plant', 'Electrical switchroom', 'Housekeeping store'],
   '1':  ['Visitor services office', 'Membership office', 'Human resources', 'Finance office', 'Accounts', 'Information technology', 'Server room', 'Publications', 'Imaging studio', 'Imaging store', 'Development office', 'Meeting room'],
   '2':  ["Director's office", "Director's anteroom", 'Board room', 'Deputy directors', 'Curators, European painting', 'Curators, prints and drawings', 'Curators, photography', 'Curators, arts of Asia', 'Curators, arts of the Americas', 'Curatorial library', 'Registrar', 'Exhibitions office'],
   '3':  ['Paintings conservation studio', 'Paintings conservation, varnishing room', 'X-ray room', 'Conservation science laboratory', 'Microscopy', 'Paper conservation studio', 'Paper conservation, wet room', 'Conservators\' office', 'Frame conservation', 'Conservation records']}),
 ('allerton', (15, 74.5, 60.5, 160), ['LL', '1'], {
   'LL': ['Prints and drawings storage', 'Photography cold store', 'Photography store', 'Photograph conservation', 'Library stacks', 'Library stacks', 'Rare books vault', 'Archives', 'Shop stock room', 'Auditorium green room', 'Projection booth', 'Plant room', 'Sprinkler valves', 'Housekeeping', 'Coat store', 'Chair store'],
   '1':  ['Prints and drawings study room', 'Prints and drawings, matting room', 'Prints and drawings office', 'Library office', 'Library cataloguing']}),
 ('morton', (70.5, 90.5, 159.3, 223.5), ['LL'], {
   'LL': ['Arms and armour store', 'Textile store', 'Textile conservation studio', 'Dye laboratory', 'European decorative arts store', 'Furniture store', 'Mount-making workshop', 'Exhibition lighting store']}),
 ('rice', (150.5, 193.5, 131.5, 237.5), ['LL', '1', '2'], {
   'LL': ['Loading dock', 'Receiving bay', 'Crate store', 'Packing room', 'Registrar\'s examination room', 'Quarantine room', 'Carpentry shop', 'Paint shop', 'Plexiglas shop', 'American art store', 'Sculpture store', 'Contemporary art store', 'Oversize painting racks', 'Art handlers\' room', 'Goods lift lobby', 'Plant room'],
   '1':  ['Objects conservation studio', 'Objects conservation, stone room', 'American art store', 'Painting racks', 'Frame shop', 'Frame store', 'Exhibition design studio', 'Graphics workshop', 'Art handlers\' office', 'Goods lift lobby'],
   '2':  ['Regenstein Hall, gallery A', 'Regenstein Hall, gallery B', 'Regenstein Hall, gallery C', 'Exhibition prep room', 'Curators, American art', 'Curators, modern and contemporary', 'Goods lift lobby', 'Lighting store']}),
 ('columbus', (176, 262.5, 30, 133.5), ['LL', '1', '2'], {
   'LL': ['Café kitchen', 'Cold room', 'Dry goods store', 'Dish room', 'Catering office', 'Auditorium plant', 'Stage store', 'Egyptian and ancient art store', 'Ancient art conservation', 'Plant room', 'Electrical substation', 'Refuse room'],
   '1':  ['Rubloff Auditorium', 'Auditorium foyer', 'Stage', 'Backstage', 'Stock Exchange Trading Room', 'Chagall Windows gallery (Gallery 144)', 'Columbus Drive entrance hall', 'Group entrance', 'School reception', 'Lecture room', 'Seminar room', 'Education office'],
   '2':  ['School painting studio', 'School drawing studio', 'School print workshop', 'School critique room', 'School faculty offices', 'School library annex', 'Projection booth', 'Auditorium balcony']}),
 ('east', (146, 180, 84, 133.5), ['LL', '2'], {
   'LL': ['Asian art store', 'Asian paintings study room', 'Scroll mounting studio', 'Plant room'],
   '2':  ['Curators, ancient art', 'Study room', 'Volunteers\' room', 'Lighting store']}),
]
LEVEL_Y = {'LL': -4.6, '1': 0, '2': 5.2, '3': 11.3}
G = 0.5                                             # raster cell, metres
X0, Z0, X1, Z1 = 5, -20, 270, 245

def raster(poly_list, holes):
    W, H = int((X1 - X0) / G), int((Z1 - Z0) / G)
    m = np.zeros((H, W), np.uint8)
    px = lambda pts: np.array([[(rot(p)[0] - X0) / G, (rot(p)[1] - Z0) / G] for p in pts], np.int32)
    for p in poly_list: cv2.fillPoly(m, [px(p)], 1)
    for p in holes: cv2.fillPoly(m, [px(p)], 0)
    return m

def biggest(free):
    """The largest all-free rectangle in a boolean grid (histogram method)."""
    H, W = free.shape; h = np.zeros(W, int); best = (0, 0, 0, 0, 0)
    for r in range(H):
        h = np.where(free[r], h + 1, 0); st = []
        for c in range(W + 1):
            cur = h[c] if c < W else 0; start = c
            while st and st[-1][1] >= cur:
                s, hh = st.pop(); a = hh * (c - s)
                if a > best[0]: best = (a, s, c, r - hh + 1, r + 1)
                start = s
            st.append((start, cur))
    return best

def cut(x0, x1, z0, z1):
    """One block of back-of-house: a corridor down the long side, rooms off it."""
    w, d = x1 - x0, z1 - z0; out = []
    long_x = w >= d; L, S = (w, d) if long_x else (d, w)
    if S < 3.0 or L < 3.0: return out
    cor = 2.0 if S >= 7 and L >= 9 else 0
    n = max(1, round(L / 7.5)); step = L / n
    for i in range(n):
        a, b = i * step + (0.15 if i else 0), (i + 1) * step - (0.15 if i < n - 1 else 0)
        out.append(('room', (x0 + a, x0 + b, z0 + cor + (0.3 if cor else 0), z1) if long_x else (x0 + cor + (0.3 if cor else 0), x1, z0 + a, z0 + b)))
    if cor: out.append(('corridor', (x0, x1, z0, z0 + cor) if long_x else (x0, x0 + cor, z0, z1)))
    return out

if __name__ == '__main__':
    O = json.load(open(os.path.join(ROOT, 'outline.json')))
    traced = json.load(open(os.path.join(ROOT, 'old-buildings.json')))['rooms'] + json.load(open(os.path.join(ROOT, 'modern-wing.json')))['rooms']
    school = [p for p in O['parts'] if p['id'] == '1425661250']
    solid = raster([O['outline']['pts']], [O['court']['pts']])
    rooms, n = [], 0
    for zone, (zx0, zx1, zz0, zz1), levels, prog in ZONES:
        for lev in levels:
            free = solid.copy().astype(bool)
            inz = np.zeros_like(free); inz[int((zz0 - Z0) / G):int((zz1 - Z0) / G), int((zx0 - X0) / G):int((zx1 - X0) / G)] = True
            free &= inz
            for r in traced:
                if r['level'] != lev and not (lev == 'LL' and r['level'] == 'B'): continue
                m = 0.3
                free[max(0, int((r['z0'] - m - Z0) / G)):int((r['z1'] + m - Z0) / G) + 1, max(0, int((r['x0'] - m - X0) / G)):int((r['x1'] + m - X0) / G) + 1] = False
            free = cv2.erode(free.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)          # keep off the outside wall
            names = list(prog[lev]); k = 0
            for _ in range(40):
                a, c0, c1, r0, r1 = biggest(free)
                if a * G * G < 20: break
                free[r0:r1, c0:c1] = False
                for kind, (x0, x1, z0, z1) in cut(X0 + c0 * G, X0 + c1 * G, Z0 + r0 * G, Z0 + r1 * G):
                    n += 1
                    name = 'Service corridor' if kind == 'corridor' else names[k % len(names)] + ('' if k < len(names) else ' %d' % (k // len(names) + 1))
                    if kind == 'room': k += 1
                    rooms.append(dict(id='B%s-%d' % (lev, n), name=name, level=lev, kind='corridor' if kind == 'corridor' else 'backofhouse', zone=zone,
                                      x0=round(x0, 1), x1=round(x1, 1), z0=round(z0, 1), z1=round(z1, 1), assumed=True))
    out = dict(note='Back-of-house rooms. Their extent is measured (the outline less the public rooms); their uses are assumed. See basis.', basis=BASIS, levels=LEVEL_Y, rooms=rooms)
    open(os.path.join(ROOT, 'back-of-house.json'), 'w').write(json.dumps(out).replace('{"id"', '\n{"id"'))
    by = {}
    for r in rooms: by[r['level']] = by.get(r['level'], 0) + (r['x1'] - r['x0']) * (r['z1'] - r['z0'])
    tr = {}
    for r in traced: tr[r['level']] = tr.get(r['level'], 0) + (r['x1'] - r['x0']) * (r['z1'] - r['z0'])
    print(len(rooms), 'rooms;', {k: round(v) for k, v in by.items()}, 'm2 back-of-house; traced', {k: round(v) for k, v in tr.items()})
