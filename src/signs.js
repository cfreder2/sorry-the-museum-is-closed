// Small plaques over the ways in to the rooms of a restroom block: a name and a picture. The fit-out
// (src/furnish.js) leaves a note where each goes; this draws them.

import * as THREE from 'three';

const INK = '#f3f1ea';
function person(c, x, y, s, skirt) {
  c.beginPath(); c.arc(x, y - 30 * s, 7 * s, 0, 7); c.fill();
  c.beginPath();
  if (skirt) { c.moveTo(x - 6 * s, y - 20 * s); c.lineTo(x + 6 * s, y - 20 * s); c.lineTo(x + 16 * s, y + 10 * s); c.lineTo(x - 16 * s, y + 10 * s); }
  else c.rect(x - 9 * s, y - 20 * s, 18 * s, 30 * s);
  c.closePath(); c.fill();
  c.fillRect(x - 7 * s, y + 10 * s, 5 * s, 20 * s); c.fillRect(x + 2 * s, y + 10 * s, 5 * s, 20 * s);
}
const ICON = {
  WOMEN: c => person(c, 48, 50, 1, true), MEN: c => person(c, 48, 50, 1, false),
  FAMILY: c => { person(c, 28, 50, 0.9, true); person(c, 68, 50, 0.9, false); person(c, 48, 64, 0.5, false); },
  PARENTS: c => { person(c, 36, 50, 0.95, true); person(c, 66, 64, 0.5, false); },
  CLEANER: c => { c.fillRect(46, 14, 4, 52); c.beginPath(); c.moveTo(34, 66); c.lineTo(62, 66); c.lineTo(68, 84); c.lineTo(28, 84); c.closePath(); c.fill(); },
  COAT: c => { c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.arc(48, 22, 7, Math.PI * 0.9, Math.PI * 2.4); c.stroke(); c.beginPath(); c.moveTo(48, 30); c.lineTo(16, 56); c.lineTo(80, 56); c.closePath(); c.stroke(); c.fillRect(30, 56, 36, 28); },
  FIRSTAID: c => { c.fillRect(38, 16, 20, 66); c.fillRect(15, 39, 66, 20); },
  LOCKERS: c => { for (const x of [18, 40, 62]) c.fillRect(x, 16, 17, 68); },
  MEMBER: c => { c.lineWidth = 5; c.strokeStyle = INK; c.strokeRect(14, 28, 68, 44); c.fillRect(24, 40, 22, 5); c.fillRect(24, 52, 40, 4); },
  STAFF: c => { c.lineWidth = 9; c.strokeStyle = INK; c.beginPath(); c.arc(48, 50, 30, 0, 7); c.stroke(); c.fillRect(26, 44, 44, 12); },
};

export function buildSigns(museum, plan) {
  const marks = (plan.marks || []).filter(m => m.kind === 'wcsign'), group = new THREE.Group(), mats = {}; group.name = 'signs';
  const mat = (text, icon) => {
    const key = icon + '|' + text; if (mats[key]) return mats[key];
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
    c.fillStyle = icon === 'FIRSTAID' ? '#1f6b3f' : icon === 'STAFF' || icon === 'CLEANER' ? '#3a3f47' : '#20324a'; c.fillRect(0, 0, 512, 128);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 4; c.strokeRect(6, 6, 500, 116);
    c.save(); c.translate(10, 14); c.fillStyle = INK; (ICON[icon] || ICON.STAFF)(c); c.restore();
    c.fillStyle = INK; c.textBaseline = 'middle'; let px = 58; do { c.font = `600 ${px}px Helvetica, Arial, sans-serif`; px -= 2; } while (c.measureText(text).width > 380 && px > 20);
    c.fillText(text, 116, 68);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return (mats[key] = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.72, 0.72, 0.72) }));
  };
  for (const m of marks) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.w || 1, m.h || 0.3), mat(m.text, m.icon));
    mesh.position.set(m.x + m.fx * 0.004, m.y, m.z + m.fz * 0.004); mesh.rotation.y = Math.atan2(m.fx, m.fz); mesh.matrixAutoUpdate = false; mesh.updateMatrix(); group.add(mesh);
  }
  museum.group.add(group);
  return { group, count: marks.length };
}
