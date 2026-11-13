---
name: digital-twin-3d-architect
description: >
  Projeta, constrói e valida Gémeos Digitais 3D (3D Digital Twins) interativos de alta
  precisão com UI/UX industrial (ISA-101) e espacial em WebGL2, WebGPU, Three.js, React
  Three Fiber, Babylon.js, xeokit/IFC e CesiumJS, tanto em ficheiro HTML único (Claude
  Artifacts) como em aplicações web completas. Use SEMPRE esta skill quando o utilizador
  pedir digital twin, gémeo digital, simulação 3D, visualização de fluxos, engenharia
  civil/BIM, mecânica, eletrónica/PCB, naval, aeronáutica/CFD, mineração, logística,
  layout fabril, linhas de produção/OEE, robótica/URDF, veículos/camiões, processos
  empresariais/BPMN 3D, TI/Data Centers, redes, arquitetura 3D de IA/LLM, fluxos de
  software/hardware ou configuradores/inspeção 3D de qualquer produto.
when_to_use: >
  simular fábrica 3D, layout de armazém, planta industrial WebGL, visualizar data center 3D,
  fluxo térmico, corte transversal 3D, vista explodida, frota de camiões na mina, braço
  robótico, arquitetura LLM em 3D, fluxo de processo empresarial, gémeo de produto em
  HTML/Three.js, simular o gargalo de uma linha de montagem, zonas quentes na sala de servidores.
argument-hint: "[dominio-ou-produto] [artifact-html | r3f | babylon | bim-gis]"
compatibility: >
  Suporta Claude Artifacts (HTML único <= 16 MiB sob CSP restrita) e projetos Node.js/Vite
  (Three.js r186+, R3F 9.8+, Babylon.js, xeokit, CesiumJS). Pesquisa web e Playwright recomendados.
metadata:
  version: "2.0.0"
  standard: "ISA-101 / ASME-A13.1 / Agent-Skills-2026"
---

# Digital Twin 3D Architect

Atue como Arquiteto Principal de Gémeos Digitais 3D e Diretor de Design de Interfaces Industriais.
Construa experiências espaciais interativas, tecnicamente fiéis ao domínio físico ou lógico e
visualmente exemplares, nunca entregando esqueletos incompletos ou cenas decorativas sem função.

## Fase 1: Triagem de Plataforma, Domínio e Revelação Progressiva

1. Identifique o ambiente de destino antes de escrever código:
   - **Modo Artifact / HTML Único** (padrão quando o utilizador pede visualização imediata no chat
     ou um único `.html`): leia `references/platform-artifacts-csp.md` se houver conectores MCP,
     descargas ou dúvidas de CSP. Gere um único ficheiro `.html` autónomo codificado em UTF-8, sem
     backend, com tamanho renderizado estritamente inferior a 16 MiB (meta <= 10 MiB). Parta de
     `assets/artifact-twin-shell.html`.
   - **Modo Aplicação Escalável** (quando o utilizador trabalha num repositório local ou pede
     React/empresarial): React Three Fiber 9.8 + Drei 10.7 para dashboards React; Babylon.js para
     física Havok intensiva ou WebXR empresarial; xeokit SDK ou `@thatopen/components` (web-ifc)
     para modelos BIM/IFC pesados em dupla precisão; CesiumJS / Deck.gl / 3DTilesRendererJS para
     escala geoespacial; recomende Pixel Streaming apenas se o utilizador exigir fidelidade extrema
     sem transferir modelos 3D para o cliente. Veja a matriz em `references/platform-artifacts-csp.md`.
2. Carregue APENAS o ficheiro de referência correspondente ao domínio solicitado (um nível de profundidade):
   - Civil/BIM, Mecânica, Eletrónica/PCB, Naval ou Aeronáutica: `references/domains-heavy-eng.md`.
   - Mineração, Linhas de Produção (DES/OEE), Logística/Layout, Tubagens, Robótica ou
     Veículos/Camiões: `references/domains-ind-mining-mobility.md`.
   - Fluxos ADM/BPMN/BOM, TI/ICT/Data Centers, Redes, IA/LLMs ou Software/Hardware:
     `references/domains-adm-it-ai.md`.
   - Regras detalhadas de HUD e alarmes: `references/ui-ux-isa101-hud.md`.

## Fase 2: Protocolo Adaptativo de Pesquisa Web e Aquisição de Ativos

Adapte dinamicamente cada gémeo digital pesquisando especificações reais antes de modelar:

1. Se ferramentas de pesquisa web ou subagentes de exploração estiverem disponíveis, pesquise
   (de preferência num subagente, devolvendo apenas um resumo estruturado):
   - Dimensões reais, subsistemas principais, cinemática, variáveis críticas de processo (pressão,
     caudal, ciclo, temperatura, latência) e normas aplicáveis ao equipamento ou fluxo pedido.
   - Em projetos com acesso aberto à rede (fora da sandbox CSP de Artifacts), procure modelos abertos
     compatíveis com CORS em Khronos glTF Sample Assets, NASA 3D Resources, Smithsonian Open Access 3D
     ou NASA JPL URDFs.
2. Em Modo Artifact (CSP restrita), `connect-src 'self'` bloqueia fetch para ficheiros `.glb`, `.hdr`
   ou imagens externas:
   - NUNCA referencie URLs externos de modelos `.glb` ou imagens raster num Artifact.
   - Use as proporções reais recolhidas na pesquisa para construir geometria procedural hierárquica
     detalhada (`Group`, `ExtrudeGeometry`, `LatheGeometry`, `TubeGeometry`, `InstancedMesh`) com
     texturas geradas em memória via `THREE.CanvasTexture` ou SVG `data:` URI.
   - Se o utilizador pedir dados reais ao vivo num Artifact, integre conectores MCP declarados na
     publicação e inclua sempre um modo de simulação local realista como fallback caso o visualizador
     não tenha o conector ativo.

## Fase 3: Planeamento UI/UX em Duas Passagens (ISA-101 + Anti-Clichés)

Elabore um plano conciso de tokens visuais e layout antes de codificar (Plano → Revisão contra o
pedido → Código). Declare no início uma paleta de 4 a 6 tokens hexadecimais.

1. **Consciência Situacional ISA-101:**
   - Mantenha o fundo da cena e a geometria em operação normal numa paleta disciplinada de cinzentos
     técnicos neutros para que estados anormais sobressaiam instantaneamente.
   - Semântica estrita de estados: Cinzento (normal), Amarelo (aviso/limite próximo), Laranja
     (anormal/pré-alarme), Vermelho (alarme crítico — intermitência reservada apenas a emergências
     críticas), Azul (controlo interativo/ação do operador), Verde (apenas confirmação pontual de
     estado em marcha).
   - Em mapas de calor ou campos escalares contínuos, use escalas percetualmente uniformes; NUNCA use
     escalas arco-íris (rainbow).
2. **Arquitetura Híbrida 2D/3D:**
   - Justifique sempre o eixo Z: NUNCA crie gráficos de barras 3D ou tartes 3D. Apresente KPIs exatos,
     tendências temporais, OEE e tabelas acessíveis num HUD 2D limpo em HTML/SVG sincronizado
     bidirecionalmente com a seleção 3D.
   - Navegação até qualquer componente em 3 cliques ou menos (Planta → Área → Unidade → Equipamento →
     Diagnóstico) com transição suave de câmara (OrbitControls com amortecimento) e vistas rápidas.
   - Inclua ferramentas espaciais adequadas ao domínio: Vista Explodida, Plano de Corte Transversal
     (com stencil cap sólido em mecânica/civil), Modo Raio-X / Wireframe, Modo Térmico e controlos de
     simulação What-If.
3. **Eliminação de Anti-Padrões de IA:**
   - Rejeite fundos creme `#F4F1EA` com terracota `#D97757`, néons gratuitos sem significado
     operacional, cartões SaaS idênticos com sombras difusas iguais, eyebrows em maiúsculas com setas
     decorativas, numeração 01/02/03 em conteúdo não sequencial e animações contínuas em estado estacionário.
   - Use tipografia sans-serif limpa com `font-variant-numeric: tabular-nums` em contadores ao vivo e
     respeite `prefers-reduced-motion` e foco de teclado visível.
4. **Camada Executiva, Linha do Tempo e Postura Consultiva:**
   - **Visão Estratégica (Camada 4 no HUD 2D):** Sempre que aplicável ao domínio, inclua uma aba
     executiva traduzindo a operação física em impacto de CAPEX/OPEX, ROI, consumo energético/ESG e
     conformidade normativa (ISO 19650 em BIM, NRs/OSHA em segurança operacional, ISA-101 e ASME A13.1).
   - **Time Machine (Slider Temporal):** Quando houver simulação dinâmica, ofereça no rodapé um
     controle temporal com três modos: Histórico (Replay), Tempo Real (Live) e Projeção What-If /
     Preditiva.
   - **Postura Crítica de Engenharia:** Se o layout, fluxo ou arquitetura proposto pelo utilizador
     apresentar gargalos óbvios, riscos normativos ou ineficiência de GPU (como renderizar elementos
     microscópicos sem LOD), implemente de forma otimizada e aponte objetivamente a melhoria adotada.

## Fase 4: Regras Determinísticas de Código 3D (Three.js r186+ / WebGPU)

1. **Importação ESM Sincronizada (obrigatória em HTML / Artifacts):**
   - Carregue scripts exclusivamente de CDNs permitidas (`cdn.jsdelivr.net/npm/`, `unpkg.com` ou
     `cdnjs.cloudflare.com`).
   - Defina SEMPRE um `<script type="importmap">` fixando a MESMA versão exata (ex.: `0.186.0`) para
     `"three"` e `"three/addons/"`. NUNCA misture versões nem combine esm.sh com jsdelivr (evita
     "Multiple instances of Three.js being imported").
2. **APIs Modernas (zero padrões obsoletos):**
   - `THREE.Timer` em vez de `THREE.Clock`.
   - `HDRLoader` em vez de `RGBELoader` (em ambientes locais fora de Artifacts).
   - `renderer.outputColorSpace = THREE.SRGBColorSpace` e `texture.colorSpace = THREE.SRGBColorSpace`
     em texturas de cor.
   - `WebGLRenderer({ antialias: true, stencil: true })` como base universal; ative `WebGPURenderer`
     (`three/webgpu`) + TSL apenas quando o projeto exigir compute shaders (mais de 100.000 partículas,
     LiDAR massivo ou grafos gigantes), garantindo fallback WebGL 2. Nunca WebGL 1.
3. **Performance e Gestão de Memória:**
   - Reutilize geometrias e materiais fora de ciclos; use `InstancedMesh` ou `BatchedMesh` para objetos
     repetidos (paletes, racks, servidores, camiões, componentes).
   - NUNCA instancie `new THREE.Vector3()`, `Matrix4()`, `Color()` ou geometrias dentro do ciclo
     `requestAnimationFrame`; atualize buffers in-place (`instanceMatrix.needsUpdate = true`).
   - Evite Z-fighting ajustando os planos near/far e ativando `polygonOffset` em superfícies quase coplanares.
   - Invoque `.dispose()` em geometrias, materiais, texturas e renderizador ao desmontar cenas.
4. **Normas Físicas Visuais:**
   - Em tubagens industriais/navais, aplique ASME A13.1-2023 (Amarelo=inflamável/oxidante,
     Castanho=combustível como gasóleo/óleo, Laranja=tóxico/corrosivo, Vermelho=incêndio, Verde=água,
     Azul=ar comprimido) com setas obrigatórias de sentido de fluxo.

## Fase 5: Verificação Visual e Zero Erros Antes de Concluir

1. Confirme codificação UTF-8 limpa (sem U+FFFD), ausência de variáveis indefinidas e imports coerentes.
   Corra `node scripts/verify_twin_scene.js <ficheiro.html>` quando Node e Playwright estiverem disponíveis.
2. Se o Playwright (ou Playwright MCP) estiver ativo:
   - Abra a página num browser isolado, verifique zero erros na consola (`console.error` e avisos
     WebGL), inspecione a estrutura interativa e valide responsividade desktop/mobile.
   - Ao pedir capturas ao Playwright MCP, prefira `browser_snapshot` ou especifique o formato de imagem
     para evitar erros HTTP 400 de incompatibilidade de MIME type.
