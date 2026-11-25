# Erzeugt die App-Icons (eigener Entwurf: Sechseck-Plättchen mit Haus) ohne Zusatzpakete.
# Aufruf: python scripts/make-icons.py nextcloud-app/dorfromantik/img
import struct
import sys
import zlib

BG, TILE, ROOF, WALL = (79, 122, 58), (247, 244, 236), (176, 84, 52), (45, 42, 36)
# Formen in Anteilen der Kantenlänge, alle innerhalb der "maskable"-Sicherheitszone.
HEX = [(0.34, 0.22), (0.66, 0.22), (0.82, 0.5), (0.66, 0.78), (0.34, 0.78), (0.18, 0.5)]
SHAPES = [
    ([(0.39, 0.50), (0.61, 0.50), (0.61, 0.66), (0.39, 0.66)], WALL),
    ([(0.50, 0.33), (0.67, 0.50), (0.33, 0.50)], ROOF),
    (HEX, TILE),
]


def inside(points, x, y):
    result = False
    j = len(points) - 1
    for i in range(len(points)):
        xi, yi = points[i]
        xj, yj = points[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            result = not result
        j = i
    return result


def color(x, y):
    return next((c for points, c in SHAPES if inside(points, x, y)), BG)


def write_png(size, path, samples=3):
    raw = bytearray()
    for py in range(size):
        raw.append(0)
        for px in range(size):
            colors = [color((px + (sx + 0.5) / samples) / size, (py + (sy + 0.5) / samples) / size)
                      for sy in range(samples) for sx in range(samples)]
            raw.extend(sum(c[k] for c in colors) // len(colors) for k in range(3))

    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))

    header = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    with open(path, 'wb') as out:
        out.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header)
                  + chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))


for edge in (180, 192, 512):
    write_png(edge, f'{sys.argv[1]}/icon-{edge}.png')
