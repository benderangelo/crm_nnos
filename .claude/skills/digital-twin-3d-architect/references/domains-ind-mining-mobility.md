# Domínios: Mineração, Produção, Logística, Tubagens, Robótica e Veículos

Índice: [Mineração](#mineração) · [Linhas de Produção (DES/OEE)](#linhas-de-produção-des--oee) ·
[Layout e Logística](#layout-e-logística) · [Tubagens ASME A13.1](#tubagens-asme-a131-2023) ·
[Robótica](#robótica) · [Veículos e Camiões](#veículos-e-camiões)

## Mineração
- Integra modelos geoespaciais (drone/LiDAR) com telemetria de equipamentos e parâmetros de processo.
- Construir: bancadas (benches), cotas de teor/elevação, pilhas de estocagem (stockpiles), rotas de
  transporte (haul routes), fases de alteamento de barragens (dam raise), correias transportadoras.
- Simular sistema multiagente escavadora–camião e Autonomous Haulage Systems; monitorizar haul cycle
  (carga → transporte → descarga → retorno → fila) com regras periciais no HUD.
- Escala geo: CesiumJS / 3DTilesRendererJS em modo aplicação; terreno procedural em Artifact.

## Linhas de Produção (DES / OEE)
- Motor de Simulação de Eventos Discretos (DES) no browser acoplado à cena 3D: fila de eventos por
  tempo, estações com tempo de ciclo (distribuição), buffers com capacidade, falhas/MTTR.
- Linhas multiestágio (ex.: estampagem → soldadura → pintura → montagem).
- Métricas contínuas: deteção automática de bottleneck (estação com maior utilização / buffer a montante
  cheio), throughput, utilização de máquinas e buffers, tempos de ciclo, rejeições, energia e
  **OEE = Disponibilidade × Desempenho × Qualidade**.
- Complementar com Sankey, Gantt e experiências What-If no HUD 2D.

## Layout e Logística
- AGVs, gruas, carrinhos, AMRs. Algoritmo de 3 fases para montar layout:
  1. Matriz de distâncias entre todos os objetos (excluindo marcadores).
  2. Refinamento de marcadores por proximidade e orientação de acoplamento (ignorar AMRs móveis na
     ligação fixa).
  3. Geração automática de conectores de fluxo.
- Paletes, prateleiras e veículos via `InstancedMesh`.

## Tubagens (ASME A13.1-2023)
Cinco elementos: texto legível escalado pelo diâmetro externo (com isolamento), código de cor de
perigo, setas de direção de fluxo (duplas em anéis bidirecionais), dimensionamento adequado, e
posicionamento junto a válvulas/flanges, mudanças de direção, ambos os lados de penetrações e a cada
7,6–15 m (25–50 ft) em troços retos.

| Categoria | Fundo | Texto/Seta | Exemplos |
|---|---|---|---|
| Inflamáveis e oxidantes | Amarelo | Preto | Gás natural, propano, H₂, gasolina, O₂ |
| Combustíveis | Castanho | Branco | Gasóleo, fuelóleo, óleo hidráulico/lubrificante |
| Tóxicos e corrosivos | Laranja | Preto | Ácido sulfúrico, soda cáustica, cloro, amoníaco |
| Extinção de incêndio | Vermelho | Branco | Sprinklers, espuma, CO₂ |
| Águas | Verde | Branco | Água refrigerada, condensado, potável |
| Ar comprimido | Azul | Branco | Ar de fábrica, ar de instrumentação |
| Definidos pelo utilizador | Roxo/Cinzento/Preto/Branco | Branco ou Preto | Vapor LP, azoto, vácuo, glicol |
| Abandonada | Branco (borda preta) | Preto | — |

## Robótica
- `urdf-loader` para cinemática (ex.: NASA JPL ATHLETE) fora de Artifacts; em Artifact, hierarquia de
  `Group` com juntas por rotação local.
- Física: Rapier (0.12+) ou cannon-es (0.20+) em Three.js; Havok em Babylon.js.
- Raycasting/colisões com three-mesh-bvh.

## Veículos e Camiões
- Sem parser WebGL nativo para CAN-bus bruto: telemetria via JSON/MCP ou simulação local.
- PBR automóvel: clearcoat, sheen, transmission (testar com Khronos ToyCar.glb fora de Artifacts).
- Deslocação sobre mapa urbano com minimapa e seleção acelerada por BVH; painéis de frota (rodoviária e
  fora-de-estrada) no HUD 2D.
