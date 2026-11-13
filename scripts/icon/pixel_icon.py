"""Pixel-art app icon for the web and mobile apps.

The icon is drawn on a 32x32 grid and written as SVG files (one rect per horizontal run of
same-coloured pixels). Run from the repository root:

    python3 scripts/icon/pixel_icon.py
    node scripts/icon/render-png.cjs

The first command writes the web SVG icons and scripts/icon/build/*.svg; the second renders the
mobile PNG assets from those SVGs with Playwright, at integer scales so pixels stay crisp.
"""
import sys

N = 32
PALETTE = {
    'K': '#020617',  # outline
    'B': '#3b82f6',  # roof
    'b': '#60a5fa',  # roof highlight
    'D': '#1d4ed8',  # roof shadow
    'C': '#64748b',  # chimney
    'c': '#475569',  # chimney cap
    'W': '#e2e8f0',  # wall
    'w': '#94a3b8',  # wall shade
    'Y': '#fde047',  # lit window
    'y': '#f59e0b',  # window glow edge
    'h': '#fef9c3',  # window highlight
    'R': '#b45309',  # door
    'r': '#78350f',  # door shade
    'G': '#22c55e',  # grass / arrow
    'g': '#15803d',  # dark green
    'L': '#86efac',  # light green
    'S': '#1e293b',  # star / sky detail
}
BACKGROUND = '#0f172a'


def build_grid():
    grid = [['.'] * N for _ in range(N)]

    def put(x, y, ch):
        if 0 <= x < N and 0 <= y < N:
            grid[y][x] = ch

    def rect(x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                put(x, y, ch)

    # Chimney sitting on the left roof slope (drawn first so the roof covers its base).
    rect(9, 5, 10, 10, 'C')
    rect(8, 4, 11, 4, 'c')

    # Stepped roof with a 2 px apex at columns 15-16, so the house is centred.
    for y in range(6, 16):
        left, right = 15 - (y - 6), 16 + (y - 6)
        rect(left, y, right, y, 'B')
        put(left, y, 'b')
        put(left + 1, y, 'b')
        put(right, y, 'D')
    rect(6, 15, 25, 15, 'D')

    # Walls with a shaded right side and a shadow under the roof.
    rect(7, 16, 24, 27, 'W')
    rect(24, 16, 24, 27, 'w')
    rect(7, 16, 24, 16, 'w')

    # Windows: dark frame, lit glass with a highlight and a warm lower edge.
    for x0 in (8, 19):
        rect(x0, 18, x0 + 4, 21, 'K')
        rect(x0 + 1, 19, x0 + 3, 20, 'Y')
        rect(x0 + 1, 20, x0 + 3, 20, 'y')
        put(x0 + 1, 19, 'h')

    # Door with frame, shade and knob, centred under the apex.
    rect(14, 19, 17, 27, 'K')
    rect(15, 20, 16, 27, 'R')
    rect(16, 20, 16, 27, 'r')
    put(15, 23, 'Y')

    # Grass.
    rect(3, 28, 28, 28, 'G')
    rect(3, 29, 28, 29, 'g')
    for x in (5, 10, 21, 26):
        put(x, 28, 'L')

    # 1 px outline around every shape.
    solid = [[grid[y][x] != '.' for x in range(N)] for y in range(N)]
    for y in range(N):
        for x in range(N):
            if solid[y][x]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < N and 0 <= ny < N and solid[ny][nx]:
                    grid[y][x] = 'K'
                    break

    # Zigzag trend arrow drawn in front of the house, with its own outline on top.
    trend = [['.'] * N for _ in range(N)]

    def trend_put(x, y, ch):
        if 0 <= x < N and 0 <= y < N:
            trend[y][x] = ch

    # One small zig near the ground, then a long rise across the facade.
    points = [(3, 25), (7, 21), (11, 25), (26, 10)]
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        step_y = 1 if y1 > y0 else -1
        for i in range(x1 - x0 + 1):
            x, y = x0 + i, y0 + i * step_y
            trend_put(x, y, 'G')
            trend_put(x, y + 1, 'g')
    # Arrowhead: solid triangle pointing up-right; the line meets the middle of its long edge.
    head_x, head_y = 24, 8
    for k in range(5):
        for x in range(head_x + k, head_x + 5):
            trend_put(x, head_y + k, 'G')
    for x in range(head_x, head_x + 5):
        trend_put(x, head_y, 'L')
    for y in range(head_y, head_y + 5):
        trend_put(head_x + 4, y, 'L')

    for y in range(N):
        for x in range(N):
            if trend[y][x] != '.':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < N and 0 <= ny < N and trend[ny][nx] != '.':
                    grid[y][x] = 'K'
                    break
    for y in range(N):
        for x in range(N):
            if trend[y][x] != '.':
                grid[y][x] = trend[y][x]

    # A few faint stars in the empty sky.
    for x, y in ((3, 2), (21, 1), (13, 2), (2, 11), (29, 14), (24, 3)):
        if grid[y][x] == '.':
            grid[y][x] = 'S'
    return grid


def to_svg(grid, size, background=True, rounded=False, padding=0):
    """Render the grid; padding is in grid pixels around the art (for adaptive icons)."""
    total = N + 2 * padding
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {total} {total}" '
        'shape-rendering="crispEdges" role="img" aria-label="Pixel art house with a rising green arrow">'
    ]
    if background:
        if rounded:
            # Pixel-style rounded corners: trim 2-1 px steps at each corner.
            parts.append(
                f'<path fill="{BACKGROUND}" d="M2 0H{total-2}V1H{total-1}V2H{total}V{total-2}H{total-1}V{total-1}H{total-2}V{total}'
                f'H2V{total-1}H1V{total-2}H0V2H1V1H2Z"/>'
            )
        else:
            parts.append(f'<rect width="{total}" height="{total}" fill="{BACKGROUND}"/>')
    for y, row in enumerate(grid):
        x = 0
        while x < N:
            ch = row[x]
            if ch == '.':
                x += 1
                continue
            start = x
            while x < N and row[x] == ch:
                x += 1
            parts.append(f'<rect x="{start + padding}" y="{y + padding}" width="{x - start}" height="1" fill="{PALETTE[ch]}"/>')
    parts.append('</svg>')
    return '\n'.join(parts) + '\n'


if __name__ == '__main__':
    import os

    grid = build_grid()
    os.makedirs('scripts/icon/build', exist_ok=True)
    outputs = {
        'apps/web/public/favicon.svg': to_svg(grid, 32, background=True, rounded=True),
        # Maskable icon: art inside the central 80% so circular masks do not clip it.
        'apps/web/public/apple-touch-icon.svg': to_svg(grid, 180, background=True, padding=4),
        'scripts/icon/build/icon.svg': to_svg(grid, 1024, background=True),
        'scripts/icon/build/art.svg': to_svg(grid, 32, background=False),
        'scripts/icon/build/favicon.svg': to_svg(grid, 64, background=True, rounded=True),
    }
    for path, svg in outputs.items():
        with open(path, 'w') as f:
            f.write(svg)
        print(f'wrote {path}')
