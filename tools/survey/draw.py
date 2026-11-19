#!/usr/bin/env python3
"""Draw every traced room, level by level, over the map outline:  python3 tools/survey/draw.py out.png"""
import json, sys, math, os, cv2, numpy as np
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'survey')
A = math.radians(0.94)
def rot(p):
    x, z = p[0] - 140, p[1] - 110
    return (140 + x * math.cos(A) - z * math.sin(A), 110 + x * math.sin(A) + z * math.cos(A))
O = json.load(open(os.path.join(ROOT, 'outline.json')))
R = json.load(open(os.path.join(ROOT, 'old-buildings.json')))['rooms'] + json.load(open(os.path.join(ROOT, 'modern-wing.json')))['rooms']
ppm, box, tiles = 3, (5, -20, 265, 245), []
COL = {'gallery': (60, 60, 220), 'backofhouse': (150, 150, 150), 'void': (120, 200, 230), 'court': (120, 200, 230)}
for lev in ['LL', '1', '2', '3']:
    im = np.full(((box[3] - box[1]) * ppm, (box[2] - box[0]) * ppm, 3), 255, np.uint8)
    for w in [O['outline'], O['court']]:
        cv2.polylines(im, [np.array([[(rot(p)[0] - box[0]) * ppm, (rot(p)[1] - box[1]) * ppm] for p in w['pts']], np.int32)], True, (0, 170, 0), 2)
    for r in R:
        if r['level'] != lev and not (lev == 'LL' and r['level'] == 'B'): continue
        a = (int((r['x0'] - box[0]) * ppm), int((r['z0'] - box[1]) * ppm)); b = (int((r['x1'] - box[0]) * ppm), int((r['z1'] - box[1]) * ppm))
        cv2.rectangle(im, a, b, COL.get(r['kind'], (200, 90, 40)), 1)
        if r['id'].startswith('G'): cv2.putText(im, r['id'][1:6], (a[0] + 2, a[1] + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.28, (0, 0, 0), 1)
    cv2.putText(im, 'level ' + lev, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2); tiles.append(im)
cv2.imwrite(sys.argv[1], np.vstack([np.hstack(tiles[:2]), np.hstack(tiles[2:])]))
