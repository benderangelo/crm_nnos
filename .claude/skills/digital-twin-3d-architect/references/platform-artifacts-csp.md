# Plataforma: Claude Artifacts (CSP), Importmap e Matriz de Motores

## Regras de Artifact
- Página publicada = um único documento `.html`/`.htm`/`.md`, UTF-8 válido sem U+FFFD.
- Tamanho renderizado ≤ 16 MiB (meta ≤ 10 MiB); `data:` URIs contam para o limite.
- Scripts só de hosts permitidos: `cdnjs.cloudflare.com`, `cdn.jsdelivr.net/npm/`, `unpkg.com`,
  CDN do Tailwind e jQuery. Folhas de estilo externas só do Google Fonts.
- `connect-src 'self'`: fetch/XHR/WebSocket para domínios externos e imagens externas são bloqueados.
  Não carregar `.glb`, `.hdr` ou rasters remotos → geometria procedural + `CanvasTexture`/SVG inline.
- Descargas iniciadas por JS via `data:`/`blob:` são bloqueadas: para exportar CSV/PNG declare a
  capacidade de runtime de downloads na publicação.
- Dados vivos: declarar conectores MCP na publicação (chamadas intermediadas com as permissões de quem
  vê a página). Manter sempre um gerador estocástico local como estado degradado.
- Cowork (Desktop) partilha origem `cowork-artifact://local`; artefactos de conversa correm em iframe
  de origem isolada.

## Importmap sincronizado
```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/"
} }
</script>
```
- Mesma versão exata para núcleo e addons. Nunca URLs completos fora do importmap, nunca esm.sh
  misturado com jsdelivr (erro "Multiple instances of Three.js being imported").
- `examples/js` foi removido na r148: só ES Modules. Nunca usar r128 legado.
- Substituições: `Clock`→`Timer`; `RGBELoader`→`HDRLoader`; `PostProcessing`→`RenderPipeline` (WebGPU);
  WebGL 1 banido.

## WebGL 2 vs WebGPU
- Base: `WebGLRenderer` (InstancedMesh desenha ~100.000 marcas num draw call; KTX2/Basis comprime
  texturas 4–8× face a PNG/JPEG).
- `WebGPURenderer` + TSL só para compute pesado (> 100k partículas, LiDAR massivo, grafos gigantes)
  ou cenas estáticas intensivas em CPU; sempre com fallback WebGL 2.
- Ganho do WebGPU em cenas convencionais é modesto (≈1,3–1,5 ms/frame num benchmark Babylon.js) e
  custa ~2,7 MB de tradutores de shaders — não é ganho universal.

## Matriz de motores (modo aplicação)
| Motor | Caso ideal | Forças | Cuidados |
|---|---|---|---|
| Three.js vanilla r186+ | Artifacts HTML, viewers leves, Vue/Svelte | ~150–200 KB com tree-shaking, controlo total | Exige governação de arquitetura |
| R3F 9.8 + Drei 10.7 | Apps React com dashboards e estado | Árvore 1:1 no DevTools, Drei, Rapier | Requer build (Vite) e React |
| Babylon.js | Programas multi-ano, física Havok, WebXR | Tudo-em-um, Inspector | Bundle completo > 2 MB |
| xeokit / That Open (web-ifc) | BIM/IFC, GIS, LiDAR | Dupla precisão, `.XKT`, BCF, cortes | xeokit AGPL-3.0 ou comercial; só ESM |
| CesiumJS / Deck.gl / 3DTilesRendererJS | Mineração, cidades, frotas geo | 3D Tiles, metadados estruturais | Gestão de sistemas de coordenadas |
| Pixel Streaming (Unreal/Omniverse) | Fidelidade extrema, proteção de IP CAD | Modelos ficam no servidor | GPU cloud cara; 5–15 Mbps/utilizador |
