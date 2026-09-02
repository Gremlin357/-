import json
import math
import re
import xml.etree.ElementTree as ET

SOURCE = "генплан для Codex.svg"
OUT = "src/sceneData.js"
NUMBER = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")

def nums(text):
    return [float(x) for x in NUMBER.findall(text or "")]

def path_points(d):
    tokens = re.findall(r"[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", d or "")
    i = 0; cmd = ""; x = y = 0.0; sx = sy = 0.0; out = []; subpaths = []
    previous_op = ""; cubic_control = None; quadratic_control = None
    def take(n):
        nonlocal i
        if i + n > len(tokens) or any(t.isalpha() for t in tokens[i:i+n]): return None
        a = [float(t) for t in tokens[i:i+n]]; i += n; return a
    while i < len(tokens):
        if tokens[i].isalpha(): cmd = tokens[i]; i += 1
        rel = cmd.islower(); op = cmd.upper()
        if op == "Z":
            if out and (x != sx or y != sy): out.append([sx, sy])
            x, y = sx, sy
            cmd = ""; previous_op = "Z"; cubic_control = quadratic_control = None; continue
        n = {"M":2,"L":2,"H":1,"V":1,"C":6,"S":4,"Q":4,"T":2,"A":7}.get(op)
        if not n: i += 1; continue
        a = take(n)
        if a is None: cmd = ""; continue
        if op == "M" or op == "L":
            nx, ny = a[-2], a[-1]
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            if op == "M":
                if out:
                    subpaths.append(out)
                out = [[x, y]]
                sx, sy = x, y
                cmd = "l" if rel else "L"
            else:
                out.append([x, y])
            previous_op = op; cubic_control = quadratic_control = None
        elif op == "H": x = x + a[0] if rel else a[0]; out.append([x,y]); previous_op = op; cubic_control = quadratic_control = None
        elif op == "V": y = y + a[0] if rel else a[0]; out.append([x,y]); previous_op = op; cubic_control = quadratic_control = None
        elif op == "C":
            p0 = (x, y)
            c1 = (x + a[0], y + a[1]) if rel else (a[0], a[1])
            c2 = (x + a[2], y + a[3]) if rel else (a[2], a[3])
            end = (x + a[4], y + a[5]) if rel else (a[4], a[5])
            for step in range(1, 9):
                t = step / 8; u = 1 - t
                out.append([u**3*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t**3*end[0], u**3*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t**3*end[1]])
            x, y = end; cubic_control = c2; quadratic_control = None; previous_op = op
        elif op == "S":
            p0 = (x, y)
            c1 = (2*x - cubic_control[0], 2*y - cubic_control[1]) if previous_op in ("C", "S") and cubic_control else p0
            c2 = (x + a[0], y + a[1]) if rel else (a[0], a[1])
            end = (x + a[2], y + a[3]) if rel else (a[2], a[3])
            for step in range(1, 9):
                t = step / 8; u = 1 - t
                out.append([u**3*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t**3*end[0], u**3*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t**3*end[1]])
            x, y = end; cubic_control = c2; quadratic_control = None; previous_op = op
        elif op == "Q" or op == "T":
            p0 = (x, y)
            if op == "T":
                c = (2*x - quadratic_control[0], 2*y - quadratic_control[1]) if previous_op in ("Q", "T") and quadratic_control else p0
                end = (x + a[0], y + a[1]) if rel else (a[0], a[1])
            else:
                c = (x + a[0], y + a[1]) if rel else (a[0], a[1])
                end = (x + a[2], y + a[3]) if rel else (a[2], a[3])
            for step in range(1, 9):
                t = step / 8; u = 1 - t
                out.append([u*u*p0[0] + 2*u*t*c[0] + t*t*end[0], u*u*p0[1] + 2*u*t*c[1] + t*t*end[1]])
            x, y = end; quadratic_control = c; cubic_control = None; previous_op = op
        elif op == "A": x, y = (x + a[5], y + a[6]) if rel else (a[5], a[6]); out.append([x,y]); previous_op = op; cubic_control = quadratic_control = None
    if out:
        subpaths.append(out)
    return subpaths

def style(el):
    values = {k: el.get(k, "") for k in ("fill", "stroke", "fill-opacity", "stroke-opacity", "stroke-width", "fill-rule")}
    for item in (el.get("style", "").split(";") if el.get("style") else []):
        if ":" in item:
            k,v = item.split(":",1); values[k.strip()] = v.strip()
    return {"fill": values["fill"], "stroke": values["stroke"], "fillOpacity": float(values["fill-opacity"] or 1), "strokeOpacity": float(values["stroke-opacity"] or 1), "strokeWidth": float(values["stroke-width"] or 1), "fillRule": values["fill-rule"]}

def points_for(el):
    tag = el.tag.split("}")[-1]
    if tag == "path": return path_points(el.get("d"))
    if tag in ("polyline", "polygon"):
        points = nums(el.get("points", ""))
        pairs = [[points[index], points[index + 1]] for index in range(0, len(points) - 1, 2)]
        if tag == "polygon" and pairs and pairs[0] != pairs[-1]:
            pairs.append(pairs[0][:])
        return [pairs] if pairs else []
    if tag == "rect":
        x,y,w,h = [float(el.get(k,0)) for k in ("x","y","width","height")]
        return [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]
    if tag == "circle":
        cx,cy,r = [float(el.get(k,0)) for k in ("cx","cy","r")]
        return [[cx+math.cos(j*2*math.pi/24)*r, cy+math.sin(j*2*math.pi/24)*r] for j in range(25)]
    return []

def transformed(points, transform):
    if not transform:
        return points
    match = re.search(r"rotate\(\s*([-+]?\d*\.?\d+)\s*([^)]*)\)", transform)
    if not match:
        return points
    angle = math.radians(float(match.group(1))); args = nums(match.group(2))
    cx, cy = (args + [0.0, 0.0])[:2]
    c, s = math.cos(angle), math.sin(angle)
    return [[cx + (x-cx)*c - (y-cy)*s, cy + (x-cx)*s + (y-cy)*c] for x,y in points]

root = ET.parse(SOURCE).getroot(); paths=[]
for el in root.iter():
    if el.tag.split("}")[-1] not in ("path","rect","circle","polyline","polygon"): continue
    raw = points_for(el)
    if tag := el.tag.split("}")[-1]:
        point_sets = raw if tag in ("path", "polyline", "polygon") else [raw]
    point_sets = [transformed(points, el.get("transform")) for points in point_sets]
    point_sets = [points for points in point_sets if len(points) >= 2]
    if not point_sets: continue
    paths.append({"style":style(el),"shapes":point_sets,"subPaths":point_sets})
with open(OUT,"w",encoding="utf-8") as f:
    f.write("// Generated from the settlement SVG. Runtime does not read SVG.\nexport const sceneData = ")
    json.dump({"width":10144,"height":3831,"paths":paths},f,separators=(",",":"),ensure_ascii=False)
    f.write(";\n")
print(f"Exported {len(paths)} numeric paths")
