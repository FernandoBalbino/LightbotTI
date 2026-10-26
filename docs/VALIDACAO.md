# Validação do Lightbot TI

## Integridade e solução

- Base inspecionada: `cadfa5dff0770fa451993efa21b7da792b8d07da`.
- Blob original de `lightbot.model.map.js`: `5bf9388b400c75b8153dea9b41eccde5ca651c1e`, verificado automaticamente com normalização de quebras de linha do Git.
- Exatamente 16 fases; são preservados todos os blocos, alturas, quadrados azuis e estados iniciais, inclusive a última fase.
- 128 configurações publicadas por fase: **2.048 configurações**. Todas as três posições de cada configuração foram tratadas como a posição correta em testes do motor real: **6.144 percursos completos**, sem movimentos bloqueados ou luzes antes da coleta.
- Os testes 01–20 do pedido estão cobertos por grupos em `tests/education.test.mjs`, além dos testes de regressão herdados.

## Sorteio

Cada fase tem uma solução de referência produzida com as regras originais. Nenhum item ocupa casas dessa rota, a casa inicial ou um quadrado azul. O algoritmo descarta casas inalcançáveis e quedas que impediriam o retorno, aplica limites de percurso, separa os objetos e valida a visibilidade contra as faces dos blocos usando a projeção original e ambas as ordens de desenho.

A validação de visibilidade exige pelo menos 95% da área central reconhecível do sprite sem oclusão por blocos. Também rejeita a sobreposição dos envelopes dos três sprites. A presença momentânea do robô sobre um objeto durante a execução não é tratada como oclusão permanente.

As posições ficam estáveis por uma semente persistida. Uma solução testemunha visita o item, retorna à posição e direção iniciais e executa a referência original; o jogador pode escolher qualquer outro caminho válido. Os limites adicionais são 12/20/28/36 comandos nos quatro grupos de fases. As três primeiras não exigem salto no desvio.

## Medalhas e execução

Os limites originais recebem o custo da excursão testemunha. O bronze também cobre o tamanho da solução testemunha completa. A contagem permanece estrutural: cada Repetir e cada bloco de seu corpo contam uma vez. Soluções acima do limite concluem a fase sem medalha. Movimentos bloqueados continuam sendo ignorados, com feedback, conforme a preferência escolhida.

## Navegador e distribuição

Evidências locais de navegador ficam em `qa-evidence/`, fora do controle de versão. O relatório final deve registrar a execução dos testes, builds, as resoluções verificadas, as fases concluídas pela interface e a verificação pública/offline. A suíte de modelo não substitui os testes reais no navegador.

Verificação local concluída: **26 testes aprovados**, lint sem avisos e builds web/offline gerados. As fases 1, 8, 12, 15 e 16 concluíram o fluxo real em Chrome, com pausa/continuação. Também passaram clique e teclado, repetições aninhadas, mover comandos, arrastar/excluir, restauração do programa, estabilidade dos itens e novo sorteio. A recarga com a rede desligada preservou a fase e seus recursos. Console da execução automatizada: **nenhum erro**.

Foram inspecionados os 16 tabuleiros em 1366×768 após a ampliação, sem rolagem da página. A versão agora enquadra o mapa no retângulo real do canvas, em vez de reduzir uma cena quadrada. Nessa resolução, a área exibida de 784×480 usa um buffer de 1568×960 pixels. Também foi verificado o layout em 1920×1080. O sprite original tem blob `c1f5be31aaf3c8778f73c96b81b35e72fbfea144`, também comparado em teste.

## Limites reais

- Verificações de compatibilidade usam Chrome/Chromium em resoluções equivalentes; não são medições em um Chromebook físico ou em uma TV projetada.
- O progresso é local ao navegador, sem contas ou sincronização entre dispositivos.
- O modo offline da versão web depende de um primeiro carregamento completo. O aviso só confirma o cache preparado, não disponibilidade anterior ao primeiro acesso.
- Os símbolos dos serviços Google são ilustrações locais reconhecíveis, não recursos oficiais.
- A inspeção visual cobre uma configuração por fase, enquanto a validação geométrica automatizada cobre todas as configurações publicadas.
