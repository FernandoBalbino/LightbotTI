# Lightbot TI — Desafio do Robô

Adaptação educacional do [Lightbot de Laurent Haan](https://github.com/haan/Lightbot), para o 2º ano do Ensino Médio Técnico em Manutenção e Suporte em Informática.

**Jogar:** https://fernandobalbino.github.io/LightbotTI/

Leia a dica, programe o robô para coletar automaticamente o objeto correspondente e depois acenda todos os quadrados azuis. São os **16 mapas originais**, o mesmo robô, a mesma física e o mesmo editor com repetições aninhadas. Há exatamente três objetos por tentativa.

## Executar localmente

Requer Node **26.12.1 ou versão 26.x compatível**, conforme `.nvmrc`, e npm **11.19.0**. Não exige servidor ou instalação nos Chromebooks dos alunos.

```sh
npm ci
npm run dev
```

Para verificar e gerar as distribuições:

```sh
npm test
npm run build:web
npm run build
```

Para repetir a verificação real de navegador, com Google Chrome instalado na máquina de desenvolvimento, execute `npm run preview:web` em um terminal e `npm run qa:browser` em outro.

`dist-web/` é a distribuição para hospedagem. `dist/` é a distribuição com JavaScript e CSS integrados ao HTML; mantenha sua pasta de imagens e mídias junto do HTML. O cache offline requer abertura por HTTP(S), como o GitHub Pages. Após o primeiro carregamento completo, o indicador **Disponível offline** confirma a preparação.

## Controles

- Clique em um comando ou use Enter/Espaço para adicioná-lo; arraste para reorganizar.
- Sem arrastar: selecione uma linha, mova com ↑/↓ e use **Inserir dentro**, **Sair** e **Voltar ao programa**. Alt+↑/↓ também reorganiza.
- **Executar → Pausar → Continuar** conserva o ponto de execução.
- **Reiniciar** restaura robô, objetos e luzes, mantendo o programa e as posições sorteadas.
- **Sortear novamente** cria outra distribuição válida e reinicia a tentativa, mantendo o programa.
- **Ajuda** apresenta explicações e demonstrações em português executadas pelo motor original.

## Organização

- `src/lightbot/`: modelos, editor e renderizador originais, com integrações opcionais para o objetivo educativo.
- `src/education/`: conteúdo, sorteios, coleta, persistência, renderização, acessibilidade e demonstrações.
- `src/locales/translations.pt-BR.js`: catálogo completo em português brasileiro.
- `public/img/items/`: 19 sprites SVG locais.
- O canvas acompanha a área efetivamente exibida, amplia o tabuleiro sem recortá-lo e usa resolução de desenho mínima de 2×; o sprite original do robô é preservado.
- `scripts/generate-placements.mjs`: gera rotas e conjuntos válidos diretamente dos mapas originais, sem redesenhá-los.
- `tests/education.test.mjs`: integridade do upstream, configurações, coleta, reinício, localização e conclusão das 16 fases.
- [Validação e limites](docs/VALIDACAO.md) e [créditos dos recursos](THIRD_PARTY_NOTICES.md).

## Publicação

O workflow **Publicar Lightbot TI** testa, gera `dist-web/` e publica pelo GitHub Pages após cada push na branch `main`. Em Settings → Pages, a origem deve ser **GitHub Actions**. Não requer backend, banco de dados, conta do aluno nem serviço pago.

O progresso é local ao navegador e dispositivo. Não há sincronização de turmas. Navegação privada ou limpeza dos dados do site pode apagar o progresso; quando o armazenamento está bloqueado, a sessão continua jogável e as configurações ficam somente na memória.

## Origem e licença

Base: `haan/Lightbot`, commit `cadfa5dff0770fa451993efa21b7da792b8d07da`. O arquivo que define os mapas permanece integralmente original. A licença MIT original está em [LICENSE](LICENSE). Créditos de Laurent Haan, Zenobia Homan, surt e hektikmusic foram preservados. A adaptação e os novos recursos autorais seguem a mesma licença, ressalvadas as marcas de terceiros.
