export function attachAccessibleEditor(app) {
  const editor = app.ui.editor;
  let selected = null;
  const previousPrepare = editor._prepareProgramRows.bind(editor);
  editor._prepareProgramRows = () => {
    previousPrepare();
    document.querySelectorAll('#programContainer .lb-instruction-row').forEach(row => { row.tabIndex = 0; });
  };
  function main() { return document.getElementById('mainProgram'); }
  function setTarget(list) {
    editor.insertionList = list;
    document.querySelectorAll('.ti-insertion-target').forEach(el => el.classList.remove('ti-insertion-target'));
    if (list && list !== main()) list.classList.add('ti-insertion-target');
    document.getElementById('editorTarget').textContent = list && list !== main() ? 'Adicionando dentro de Repetir' : 'Adicionando ao programa principal';
  }
  function select(row) {
    document.querySelectorAll('.ti-selected').forEach(el => el.classList.remove('ti-selected'));
    selected = row.closest('li'); row.classList.add('ti-selected');
    document.getElementById('editorTarget').textContent = 'Comando selecionado · use os controles acima';
  }
  function action(name) {
    if (app.bot.isInExecutionMode()) return;
    if (name === 'main') { setTarget(main()); return; }
    if (!selected?.isConnected) return;
    if (name === 'up' && selected.previousElementSibling) selected.parentElement.insertBefore(selected, selected.previousElementSibling);
    if (name === 'down' && selected.nextElementSibling) selected.parentElement.insertBefore(selected.nextElementSibling, selected);
    if (name === 'inside') {
      const body = selected.querySelector(':scope > .lb-repeat-body ul');
      if (body) setTarget(body);
      else {
        const before = selected.previousElementSibling;
        const target = before?.querySelector(':scope > .lb-repeat-body ul');
        if (target) { target.appendChild(selected); setTarget(target); }
        else document.getElementById('editorTarget').textContent = 'Selecione Repetir ou mova o comando após uma repetição';
      }
    }
    if (name === 'out') {
      const enclosing = selected.parentElement.closest('li');
      if (enclosing) { enclosing.after(selected); setTarget(selected.parentElement); }
      else setTarget(main());
    }
    editor.saveProgram(); editor.makeDroppable();
  }
  document.getElementById('programContainer').addEventListener('click', e => {
    const row = e.target.closest('.lb-instruction-row');
    if (row && !e.target.closest('button,input') && !app.bot.isInExecutionMode()) select(row);
  });
  document.getElementById('programContainer').addEventListener('keydown', e => {
    if (e.target.closest('button,input')) return;
    const row = e.target.closest('.lb-instruction-row');
    if (!row || app.bot.isInExecutionMode()) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(row); }
    if (e.altKey && ['ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); select(row); action(e.key === 'ArrowUp' ? 'up' : 'down'); row.focus(); }
  });
  document.getElementById('accessibleEditor').addEventListener('click', e => {
    const button = e.target.closest('[data-edit]'); if (button) action(button.dataset.edit);
  });
  const previousShow = app.ui.showGameScreen.bind(app.ui);
  app.ui.showGameScreen = (...args) => { selected = null; editor.insertionList = null; previousShow(...args); };
  document.getElementById('rerollButton').addEventListener('click', () => {
    if (!app.map.ready()) return;
    app.map.reset(); app.education.reroll(); app.ui._setRunButtonState(false);
  });
}
