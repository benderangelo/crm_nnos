# UI/UX ISA-101 e HUD Híbrido 2D/3D

## Hierarquia de 5 níveis de ecrã (ISA-101)
1. **Nível 1 – Visão Geral da Planta:** toda a instalação, KPIs principais, saúde global.
2. **Nível 2 – Visão de Área:** zonas produtivas ou subsistemas.
3. **Nível 3 – Visão de Unidade:** agrupamentos específicos de equipamentos.
4. **Nível 4 – Detalhe de Equipamento:** tags individuais, malhas de controlo, setpoints.
5. **Nível 5 – Diagnóstico:** manutenção, calibração, histórico de falhas.

Regras: qualquer caminho em ≤ 3 cliques. Sempre visíveis: cabeçalho (área atual, data/hora da
instalação, operador, breadcrumbs) e faixa persistente de alarmes (contagem ativa, prioridade
Critical/High/Medium/Low, carimbo temporal, ação recomendada).

Três níveis de consciência situacional: **Perceção** (estado atual), **Compreensão** (impacto no
processo), **Projeção** (tendências, indicadores de desvio, alertas preditivos).

## Semântica cromática
A cor é veículo de alerta, não decoração (evitar alarm floods).

| Estado | Cor | Uso |
|---|---|---|
| Normal | Cinzento | Fundo e malhas 3D em operação normal |
| Aviso | Amarelo | Aproximação de limite |
| Anormal | Laranja | Fora de especificação / pré-alarme |
| Crítico | Vermelho | Alarme crítico; intermitência só aqui |
| Interativo | Azul | Controlos / ação requerida do operador |
| Informativo | Branco | Rótulos |
| Em marcha | Verde | Confirmação pontual, nunca a cena inteira |

A ISA-101 não fixa hex universais: declare 4–6 tokens hex no início do projeto. Tokens de partida
(shell): `#dfe3e8` viewport, `#1a73e8` ação, `#d93025` crítico, `#fa903e` alto, `#f9ab00` aviso,
`#1e8e3e` marcha. Campos contínuos: escalas percetualmente uniformes (viridis/cividis/inferno);
nunca rainbow (~8% dos homens têm daltonismo).

## Quando usar 3D vs 2D
3D só ganha em: (1) grafos densos com centenas/milhares de arestas; (2) dados espaciais/volumétricos
medidos no espaço físico; (3) campos dinâmicos variáveis no tempo; (4) > ~100.000 pontos.
Comparações categóricas, tendências e números exatos → 2D (HTML/SVG), pois a perspetiva distorce
alturas e o canvas WebGL não é legível por leitores de ecrã.

## Visor espacial
- Nevoeiro de profundidade, eixos reorientáveis à câmara.
- Seleção por raycasting (acelerar com three-mesh-bvh) ou color picking off-screen.
- Rótulos HTML projetados com teste de oclusão por fotograma.
- Seleção sincronizada bidirecionalmente com lista/tabela 2D.

## Anti-padrões bloqueados
Creme `#F4F1EA` + terracota `#D97757`; temas escuros genéricos com verde-ácido; grelhas de cartões
arredondados com a mesma sombra `rgba(0,0,0,.1)`; eyebrows em maiúsculas espaçadas; setas
decorativas → em links; numeração 01/02/03 sem sequência; animações contínuas em estado estacionário.

## Acessibilidade e tipografia
Sans-serif legível (Segoe UI, Tahoma, Arial, system-ui) com `tabular-nums`; foco de teclado visível;
respeitar `prefers-reduced-motion`; `aria-label` no visor e regiões do HUD; layout utilizável em
largura de telemóvel.
