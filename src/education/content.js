export const LEVELS = [
  ['Hardware', 'Serve para digitar letras e números.', 'keyboard', 'mouse', 'monitor'],
  ['Hardware', 'Mostra as imagens do computador.', 'monitor', 'keyboard', 'mouse'],
  ['Hardware', 'Serve para clicar e mover a setinha na tela.', 'mouse', 'keyboard', 'monitor'],
  ['Hardware', 'Guarda arquivos e fotos mesmo com o computador desligado.', 'disk', 'ram', 'monitor'],
  ['Hardware', 'Ajuda o computador a trabalhar com vários programas abertos.', 'ram', 'disk', 'keyboard'],
  ['Uso básico', 'Serve para organizar arquivos em um só lugar.', 'folder', 'trash', 'text'],
  ['Uso básico', 'Serve para abrir sites na internet.', 'chrome', 'folder', 'trash'],
  ['Redes', 'Ajuda a receber um arquivo completo, com as partes em ordem.', 'tcp', 'udp', 'router'],
  ['Redes', 'Envia informações sem esperar confirmação de cada envio, como em jogos online.', 'udp', 'tcp', 'router'],
  ['Redes', 'Ajuda a conectar a rede da escola à internet.', 'router', 'switch', 'monitor'],
  ['Google Documentos', 'Serve para escrever e editar textos.', 'docs', 'sheets', 'slides'],
  ['Google Planilhas', 'Serve para criar tabelas e fazer contas.', 'sheets', 'docs', 'slides'],
  ['Google Apresentações', 'Serve para criar apresentações com slides.', 'slides', 'sheets', 'docs'],
  ['Comunicação', 'Serve para enviar e receber e-mails.', 'gmail', 'classroom', 'docs'],
  ['Estudos', 'Serve para receber e entregar atividades da turma.', 'classroom', 'gmail', 'slides'],
  ['Segurança', 'Ajuda a bloquear acessos perigosos ao computador.', 'firewall', 'router', 'chrome'],
].map(([category, hint, correct, ...wrong], index) => ({
  index, category: index >= 10 && index <= 12 ? 'Produtividade' : category, hint, correct, items: [correct, ...wrong],
}));

export const ITEMS = Object.fromEntries([
  ['keyboard', 'Teclado'], ['mouse', 'Mouse'], ['monitor', 'Monitor'], ['disk', 'HD'],
  ['ram', 'Memória RAM'], ['router', 'Roteador'], ['switch', 'Switch'], ['folder', 'Pasta'],
  ['trash', 'Lixeira'], ['text', 'Arquivo de texto'], ['chrome', 'Google Chrome'],
  ['tcp', 'TCP'], ['udp', 'UDP'], ['docs', 'Google Documentos'], ['sheets', 'Google Planilhas'],
  ['slides', 'Google Apresentações'], ['gmail', 'Gmail'], ['classroom', 'Google Sala de Aula'], ['firewall', 'Firewall'],
].map(([id, name]) => [id, { id, name, sprite: `img/items/${id}.svg` }]));
