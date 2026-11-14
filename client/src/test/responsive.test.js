import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const css = readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');

describe('PA-11 · Interfaz web responsiva', () => {
  it('declara la etiqueta viewport para móviles y tabletas', () => {
    expect(html).toMatch(
      /<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1\.0"/
    );
  });

  it('incluye puntos de ruptura para móvil y tableta', () => {
    expect(css).toContain('@media (max-width: 900px)');
    expect(css).toContain('@media (max-width: 700px)');
    expect(css).toContain('@media (max-width: 460px)');
  });

  it('usa una cuadrícula flexible para la estructura principal', () => {
    expect(css).toContain('.app-shell');
    expect(css).toContain('grid-template-columns');
    expect(css).toContain('100dvh');
  });
});
