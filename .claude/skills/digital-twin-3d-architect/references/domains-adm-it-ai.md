# Domínios: ADM/BPMN/BOM, TI/ICT, IA e Software/Hardware, Produto Universal

Índice: [ADM](#fluxos-empresariais-adm) · [TI/ICT](#ti--ict-data-centers-e-redes) ·
[IA](#ia--llms) · [Software/Hardware](#software--hardware) · [Produto universal](#gémeo-universal-de-produto)

## Fluxos Empresariais (ADM)
- Para leitura do dia a dia, BPMN 2D visto de topo é mais legível que extrusões 3D arbitrárias.
- Usar 3D apenas onde acrescenta estrutura real:
  - Ponte entre hierarquias PDM tabulares e BOM 3D interativa (selecionar linha ↔ destacar peça).
  - Processos Model-Based Definition (MBD), onde o modelo 3D é a fonte autoritativa.
  - Fluxos interdepartamentais multicamada em que o volume de transações em trânsito revela gargalos.
- Métricas de tempo e custo ficam em tabelas 2D.

## TI / ICT (Data Centers e Redes)
- Camada física: plantas → salas navegáveis com filas de racks e servidores (portas animadas,
  extração de unidades), energia e UPS, refrigeração, corredores quente/frio, airflow, modo Raio-X
  sob piso/teto.
- Modelar racks/servidores deterministicamente com `InstancedMesh` e mapas térmicos paramétricos.
- Camada lógica: redes, cloud e microsserviços com centenas de nós → `3d-force-graph`
  (Three.js + d3-force-3d) alimentado por JSON, ou compute shaders WebGPU para grafos gigantes.

## IA / LLMs
- Referência: llm-viz (Brendan Bycroft) e llm-visualized.com — Transformers estilo GPT (nano-gpt ~85k
  parâmetros até GPT-2 124M) dispostos no espaço mostrando passo a passo embeddings, atenção, MLP e
  tensores.
- Painéis de arquitetura de serviço: pipelines de inferência (vLLM, quantização, continuous batching).

## Software / Hardware
- Editores esquemáticos digitais com simulação de execução de CPU.
- Comissionamento virtual de controladores e acionamentos (estilo S7-PLCSIM Advanced, SIMIT, DriveSim).
- Software-Defined Systems: desacoplamento de funções lógicas do hardware físico.

## Gémeo Universal de Produto
Pipeline para qualquer outro produto:
1. Pesquisar na web a anatomia técnica (dimensões, subsistemas, materiais).
2. Construir malhas hierárquicas com variantes de material (`KHR_materials_variants` em glTF fora de
   Artifacts; troca de materiais procedural em Artifact).
3. Oferecer vistas realista, térmica, corte transversal e efeitos de alarme ISA-101.
