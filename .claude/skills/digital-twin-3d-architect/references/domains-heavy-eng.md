# Domínios: Engenharia Civil, Mecânica, Eletrónica, Naval e Aeronáutica

Índice: [Civil/BIM](#civil--bim) · [Mecânica](#mecânica) · [Eletrónica](#eletrónica--pcb) ·
[Naval](#naval) · [Aeronáutica](#aeronáutica--cfd)

## Civil / BIM
- Requisito: centenas de milhares de objetos em coordenadas globais reais sem erros de arredondamento
  (sobreposição com GIS e LiDAR).
- Modo aplicação: xeokit SDK ou `@thatopen/components` (web-ifc). xeokit guarda posições RTC
  quantizadas (dupla precisão) e normais oct-encoded 16 bits; converte IFC 2x3/4.3 para `.XKT`
  (ex.: 186 MB → 12 MB).
- UX: separação por pisos (building storeys), ortográfica ↔ perspetiva, nuvens `.LAS/.LAZ`, vistas
  BCF, medições de distância/ângulo/declive, filtros temáticos (existente vs. planeado).
- Modo Artifact: estruturas paramétricas com `BatchedMesh` e cortes de secção locais.

## Mecânica
- Planos de corte com tampa sólida via stencil buffer (padrão `webgl_clipping_stencil`): passagens de
  stencil de frente e verso por objeto + passagem do plano; `renderer.clearStencil()` em
  `onAfterRender`. Renderer com `stencil: true` e `localClippingEnabled = true`.
- Vistas explodidas por hierarquia de componentes (offset ao longo do vetor centro→peça).
- Web completa: STEP/STP/IGES convertidos para glTF; `GLTFLoader` + `DRACOLoader`/meshopt;
  `MeshPhysicalMaterial` para PBR.

## Eletrónica / PCB
- Não há biblioteca open-source WebGL dedicada a Gerber (e `copper3d` é para imagem médica, não PCB).
- Modelar PCB, dissipadores e invólucros com geometria estratificada.
- Térmico: textura dinâmica em `<canvas>` 2D projetada nos componentes, shader GLSL de gradiente, ou
  volume de convecção seccionado em n fatias translúcidas com varrimento e rótulos de temperatura.
  Escala percetualmente uniforme (inferno/magma), nunca rainbow.

## Naval
- Superfície marítima: soma de ondas trocoidais de Gerstner no vertex shader, normais analíticas e
  Fresnel no fragment shader.
- Estaleiros: modelação orientada a objetos (estilo Plant Simulation for Shipyards).
- Tubagens de bordo: ISO 14726 em conjunto com ASME A13.1.

## Aeronáutica / CFD
- CFD real (ex.: SST) requer solver externo (OpenFOAM); resultados exportados podem ser carregados
  num visualizador Three.js.
- Sem backend: gerar perfil NACA 0012 (ou NACA 4 dígitos) parametrizado por velocidade e ângulo de
  ataque, com streamlines 3D animadas em torno da asa.
- Ativos: NASA 3D Resources (fora de Artifacts); HUD de voo com valores exatos em 2D.

### Fórmula NACA 4 dígitos (espessura simétrica)
`yt = 5t(0.2969√x − 0.1260x − 0.3516x² + 0.2843x³ − 0.1015x⁴)`, com t = 0.12 para NACA 0012.
