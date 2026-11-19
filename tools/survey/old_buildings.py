#!/usr/bin/env python3
"""The older buildings, traced from the museum's visitor maps.

    python3 tools/survey/old_buildings.py        writes survey/old-buildings.json

The visitor maps are axonometric. Un-projected (tools/survey/rect.py) they are a true plan of the
Michigan Avenue building: its outline lands on the map outline to within half a metre. Everything
east of it is drawn squeezed and shifted so the sheet stays compact, so each building is a separate
"piece": rooms are read in map metres and then stretched onto that building's real outline.

Each room below is (id, name, kind, x0, x1, z0, z1) in MAP metres for its piece. Read by eye off a
5 m grid: good to about half a metre on the map, so a metre or so on the ground.
"""
import json, os

# piece: map rectangle -> true rectangle (grid frame: the game frame turned 0.94 degrees about (140,110))
PIECES = {
    'main':    ((19.2, 73.7, 61.2, 159.5), (19.2, 73.6, 61.2, 159.3)),     # Michigan Avenue building, 1893
    'eastrow': ((74.0, 85.2, 61.2, 159.5), (73.6, 89.4, 61.2, 159.3)),     # the strip along the railway, beside the main block
    'south':   ((63.5, 85.2, 159.5, 221.0), (72.1, 89.4, 159.3, 222.2)),   # the south arm: Deering galleries, arms and armour
    'bridge':  ((85.2, 132.0, 96.0, 121.5), (88.9, 148.2, 100.9, 118.7)),  # Gunsaulus Hall, over the railway
    'rice':    ((129.3, 163.5, 134.5, 182.0), (152.0, 192.3, 132.6, 193.5)),  # Arts of the Americas, round the Sculpture Court
}

L2 = {
 'main': [
  ('G218','Gallery 218','gallery',19.5,30,62,74.5), ('G219','Gallery 219','gallery',30,39.5,62,69.5), ('G220','Gallery 220','gallery',39.5,47,62,69.5),
  ('G221','Gallery 221','gallery',47,54,62,69.5), ('G222','Gallery 222','gallery',59,73.5,62,74.5),
  ('R2-n','North corridor of the ring','corridor',30,59,69.5,74.5),
  ('G217','Gallery 217','gallery',19.5,25.5,74.5,92), ('G216','Gallery 216','gallery',19.5,25.5,92,101), ('G215','Gallery 215','gallery',19.5,25.5,101,112.5),
  ('G214','Gallery 214','gallery',19.5,25.5,112.5,119), ('G213','Gallery 213','gallery',19.5,25.5,119,124.5), ('G212','Gallery 212','gallery',19.5,25.5,124.5,138.5),
  ('G211','Gallery 211','gallery',19.5,30,145,159), ('R2-w','West corridor of the ring','corridor',25.5,30,74.5,145),
  ('V2-n','North light court (open to below)','void',30,54.3,74.5,96.5),
  ('G200','Gallery 200 (Grand Staircase)','stairhall',30,54.3,96.5,119.5),
  ('V2-s','Light well over the library reading room','void',37,49,119.5,140),
  ('G227','Gallery 227','gallery',30,54.3,119.5,144.5),
  ('R2-s','South corridor of the ring','corridor',30,54,144.5,149.5),
  ('G209','Gallery 209','gallery',30,39,150,159), ('G208','Gallery 208','gallery',39,46.5,150,159), ('G207','Gallery 207','gallery',46.5,54,150,159),
  ('G206','Gallery 206','gallery',54,64,146,159), ('R2-e','East corridor of the ring','corridor',54.3,60,74.5,146),
  ('G223','Gallery 223','gallery',60,73.5,74.5,82.5), ('G225','Gallery 225','gallery',60,68.5,83,90), ('G224','Gallery 224','gallery',68.5,73.5,83,90),
  ('G226','Gallery 226','gallery',60,73.5,90,99.5), ('G201','Gallery 201','gallery',60,73.5,100,116.5),
  ('G202','Gallery 202','gallery',60,66.5,117,125), ('L2-liftE','Lift','lift',67,73.5,117,125),
  ('G204','Gallery 204','gallery',60,66.5,125,133.5), ('G203','Gallery 203','gallery',67,73.5,125,133.5), ('G205','Gallery 205','gallery',60,73.5,133.5,144),
  ('G234','Gallery 234','gallery',64,73.5,146,157),
 ],
 'eastrow': [
  ('G230','Gallery 230','gallery',74.5,85,103,122), ('G231_233','Galleries 231-233','gallery',74.5,85,122,150), ('G234e','Gallery 234 (east)','gallery',74.5,85,150,159.5),
 ],
 'south': [
  ('G235','Gallery 235','gallery',63.5,85.2,160,174), ('S2-spiral','Spiral stair','stair',64,71,160,173), ('G236','Gallery 236','gallery',71,85.2,174,182),
  ('G237','Gallery 237','gallery',63.5,74,182,203), ('G238','Gallery 238','gallery',74,85.2,182,203), ('G239','Gallery 239','gallery',63.5,85.2,203,221),
 ],
 'bridge': [
  ('G240','Gallery 240','gallery',85.5,93,105,113), ('G241','Gallery 241','gallery',88,102,96,105), ('G244','Gallery 244','gallery',102,115,96,105), ('G248','Gallery 248','gallery',115,131,96,105),
  ('G243','Gallery 243','gallery',93,110,105,113), ('G246','Gallery 246','gallery',110,131,105,113),
  ('G242','Gallery 242','gallery',88,102,113,121.5), ('G245','Gallery 245','gallery',102,115,113,121.5), ('G247','Gallery 247','gallery',115,131,113,121.5),
 ],
 'rice': [
  ('G262','Gallery 262','gallery',129.5,136.5,135,148), ('G263','Gallery 263','gallery',129.5,136.5,148,158), ('G264','Gallery 264','gallery',129.5,136.5,158,167),
  ('G261','Gallery 261 (balcony round the Sculpture Court)','balcony',136.5,157,135,180), ('V2-sc','Open to the Sculpture Court below','void',141.5,151.5,151,167),
  ('G273','Gallery 273','gallery',157,163.5,135,150), ('G272','Gallery 272','gallery',157,163.5,150,168),
 ],
}

# The first-floor sheet is drawn 10 m north of where it belongs; that is taken out here, so 'main' is already true.
P1 = {
    'main':    ((19.2, 73.6, 61.2, 159.5), (19.2, 73.6, 61.2, 159.3)),
    'eastrow': ((76.0, 85.0, 61.2, 159.5), (73.6, 89.4, 61.2, 159.3)),
    'south':   ((59.0, 80.0, 160.0, 221.0), (72.1, 89.4, 159.3, 222.2)),
    'bridge':  ((86.0, 129.0, 96.0, 122.0), (88.9, 148.2, 100.9, 118.7)),
    'mck':     ((132.0, 188.0, 88.0, 135.0), (148.2, 226.5, 86.3, 132.6)),      # round McKinlock Court
    'rice':    ((129.3, 163.5, 137.0, 216.0), (152.0, 192.3, 132.6, 233.3)),
}
L1 = {
 'main': [
  ('B1-north','North range (not public)','backofhouse',19.5,73.5,61.5,72),
  ('F1-member','Member Services','service',19.5,30,72,91.5), ('F1-fullerton','Fullerton Hall','auditorium',30,52,72,92),
  ('G124B','Gallery 124B','gallery',52,59.5,72,82), ('G126','Gallery 126','gallery',59.5,63.5,72,82), ('G127A','Gallery 127A','gallery',63.5,73.5,72,82),
  ('G124A','Gallery 124A','gallery',52,59.5,82,92), ('G125','Gallery 125','gallery',59.5,63.5,82,92), ('G127B','Gallery 127B','gallery',63.5,73.5,82,92),
  ('F1-steps','Michigan Avenue entrance','entrance',15,19.5,96.4,125), ('G100','Gallery 100 (lobby and Grand Staircase)','stairhall',19.5,52,92,125),
  ('G101','Gallery 101','gallery',52,63.5,92,118), ('G101A','Gallery 101A','gallery',63.5,73.5,92,118),
  ('F1-shop','Museum Shop','shop',19.5,30,125,149.5), ('F1-library','Ryerson and Burnham Libraries','library',30,52,125,149.5),
  ('F1-shopS','Museum Shop (south room)','shop',19.5,39,149.5,159), ('G109','Gallery 109 (Ando Gallery)','gallery',39,52,149.5,159),
  ('G107','Gallery 107','gallery',52,57,125,148.5), ('G102','Gallery 102','gallery',57,63.5,125,130.5), ('G103','Gallery 103','gallery',57,63.5,130.5,136),
  ('G104','Gallery 104','gallery',57,63.5,136,142.5), ('G106','Gallery 106','gallery',57,63.5,142.5,149), ('G105','Gallery 105','gallery',63.5,73.5,118,149),
  ('G108','Gallery 108','gallery',52,63.5,149,159), ('G134','Gallery 134','gallery',63.5,73.5,149,159),
 ],
 'eastrow': [
  ('B1-rail','Railway-side range, north (not public)','backofhouse',76,85,61.2,103),
  ('G130','Gallery 130','gallery',76,85,103,118), ('G131','Gallery 131','gallery',76,85,118,127), ('G132','Gallery 132','gallery',76,85,127,137), ('G133','Gallery 133','gallery',76,85,137,149), ('G134e','Gallery 134 (east)','gallery',76,85,149,159.5),
 ],
 'south': [
  ('G135','Gallery 135 (spiral stair)','stairhall',59,80,160,174), ('F1-regenstein','Regenstein Hall','exhibition',59,80,174,221),
 ],
 'bridge': [
  ('G140','Gallery 140 (Alsdorf Galleries)','gallery',86,97,96,122), ('G141','Gallery 141 (Alsdorf Galleries)','gallery',97,108,96,122),
  ('G142','Gallery 142 (Alsdorf Galleries)','gallery',108,119,96,122), ('G143','Gallery 143 (Alsdorf Galleries)','gallery',119,129,96,122),
 ],
 'mck': [
  ('G150','Gallery 150','stairhall',132,147,94,135), ('G151','Gallery 151','gallery',147,183,88,96), ('G152','Gallery 152','gallery',181,188,96,128),
  ('G153','Gallery 153','gallery',172,188,128,135), ('G154','Gallery 154','gallery',147,172,128,135), ('V1-mck','McKinlock Court (open to the sky, floor at the lower level)','void',147,181,96,128),
 ],
 'rice': [
  ('G160','Gallery 160','gallery',129.3,163.5,137,150), ('G161','Gallery 161 (Sculpture Court)','court',136.5,156.5,150,182),
  ('B1-riceW','Rice Building, west range (not public)','backofhouse',129.3,136.5,150,216), ('B1-riceE','Rice Building, east range (not public)','backofhouse',156.5,163.5,150,216), ('B1-riceS','Rice Building, south range (not public)','backofhouse',136.5,156.5,182,216),
 ],
}

# Lower level. West: under the Michigan Avenue building. East: round McKinlock Court, whose floor is at this level.
PL = {
    'main': ((19.2, 73.6, 61.2, 159.5), (19.2, 73.6, 61.2, 159.3)),
    'mck':  ((151.0, 187.0, 92.0, 125.0), (177.9, 216.6, 94.5, 123.4)),
}
LL = {
 'main': [
  ('F0-price','Price Auditorium','auditorium',20,32,61.5,71), ('F0-wc','Restrooms','wc',32,52,82,91), ('F0-liftW','Lift','lift',25,32,96,105),
  ('G10','Gallery 10 (lower lobby, foot of the Grand Staircase)','stairhall',32,52,91,120),
  ('G24','Gallery 24','gallery',52,58,70,82), ('F0-morton','Morton Auditorium','auditorium',58,73.5,76,97),
  ('G1','Gallery 1','gallery',52,73.5,97,120), ('G2','Gallery 2','gallery',60,73.5,120,127), ('G3','Gallery 3','gallery',52,56,120,131), ('G4','Gallery 4','gallery',52,56,131,138),
  ('G11','Gallery 11 (Thorne Miniature Rooms)','gallery',36,48,120,137),
 ],
 'mck': [
  ('G50','Gallery 50 (Arts of Ancient Egypt)','gallery',146,151,86,125), ('C0-mck','McKinlock Court','garden',151,187,92,125),
  ('F0-cafe','The Café','cafe',187,220,92,131), ('F0-wcE','Restrooms','wc',187,216,86,92),
  ('G59','Gallery 59','gallery',151,176,126,131), ('G58','Gallery 58','gallery',163,176,131,142), ('G57','Gallery 57','gallery',163,176,142,159),
  ('G61','Gallery 61','gallery',133,151,133,147), ('F0-wcM','Restrooms','wc',131,146,118,133),
 ],
}
LEVELS = {'LL': (PL, LL), '1': (P1, L1), '2': (PIECES, L2)}

def true(P, piece, x0, x1, z0, z1):
    (a0, a1, c0, c1), (b0, b1, d0, d1) = P[piece]
    fx = lambda v: b0 + (v - a0) * (b1 - b0) / (a1 - a0); fz = lambda v: d0 + (v - c0) * (d1 - d0) / (c1 - c0)
    return [round(fx(x0), 1), round(fx(x1), 1), round(fz(z0), 1), round(fz(z1), 1)]

if __name__ == '__main__':
    rooms = []
    for lev, (P, pieces) in LEVELS.items():
        for piece, rs in pieces.items():
            for (i, name, kind, x0, x1, z0, z1) in rs:
                t = true(P, piece, x0, x1, z0, z1)
                rooms.append(dict(id=i, name=name, level=lev, kind=kind, piece=piece, x0=t[0], x1=t[1], z0=t[2], z1=t[3]))
    out = dict(note="The older buildings, traced from the museum's visitor maps and fitted to the map outline. Metres, grid frame (see modern-wing.json). Good to about a metre.",
               rooms=rooms)
    p = os.path.join(os.path.dirname(__file__), '..', '..', 'survey', 'old-buildings.json')
    open(p, 'w').write(json.dumps(out).replace('{"id"', '\n{"id"'))
    print(len(rooms), 'rooms')
