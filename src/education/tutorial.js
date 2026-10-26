// Localized demonstrations use the original models, sprites, projection and animation loop.
import { createBox } from '../lightbot/lightbot.model.box.js';
import { createLightBox } from '../lightbot/lightbot.model.lightbox.js';
import { createMap } from '../lightbot/lightbot.model.map.js';
import { createBot } from '../lightbot/lightbot.model.bot.js';
import { createBotInstructions } from '../lightbot/lightbot.model.bot.instructions.js';
import { createDirections } from '../lightbot/lightbot.model.directions.js';
import { Projection } from '../lightbot/lightbot.view.canvas.projection.js';
import { extendBoxView } from '../lightbot/lightbot.view.canvas.box.js';
import { extendMapView } from '../lightbot/lightbot.view.canvas.map.js';
import { extendBotView } from '../lightbot/lightbot.view.canvas.bot.js';
import { createBotAnimations } from '../lightbot/lightbot.view.canvas.bot.animations.js';
import { canvasView } from '../lightbot/lightbot.view.canvas.game.js';

export function attachTutorial(app) {
  const container = document.getElementById('videoContainer');
  container.innerHTML = '<canvas id="tutorialCanvas" width="480" height="390" aria-label="Demonstração animada dos comandos do robô"></canvas><p class="game-hint">Exemplo dos comandos originais. No desafio, colete o item antes de acender.</p><button id="playTutorial" class="lb-button" type="button">Reproduzir demonstração</button><p id="tutorialStatus" role="status">Observe o robô e depois experimente no desafio.</p>';
  const Box = createBox(), LightBox = createLightBox({Box}), instructions = createBotInstructions();
  const demo = { directions: createDirections(), speedMultiplier: 1, Projection };
  let map, loop, topic = 0, done = false;
  const status = document.getElementById('tutorialStatus');
  const labels = {walk:'Avançar',jump:'Pular',light:'Acender',turnRight:'Girar à direita',turnLeft:'Girar à esquerda',repeat:'Repetir'};
  demo.bot = createBot({ directions: demo.directions, getMap: () => map, instructions, LightBox });
  map = createMap({bot:demo.bot,Box,LightBox});demo.map=map;map.state={isComplete:()=>false};
  extendBoxView({app:demo,Box,LightBox});extendMapView(map);
  demo.bot.animations=createBotAnimations();
  extendBotView({app:demo,bot:demo.bot,map,animations:demo.bot.animations,instructions});
  demo.ui={onInstruction(command,blocked){status.textContent=labels[command.name]+(blocked?' · Movimento bloqueado':'');},onProgramFinished(){if(done)return;done=true;status.textContent='Demonstração concluída. Sua missão: programe o robô no desafio!';loop.stop();}};
  loop=canvasView(demo,document.getElementById('tutorialCanvas'));
  const types={walk:'WalkInstruction',jump:'JumpInstruction',light:'LightInstruction',turnLeft:'TurnLeftInstruction',turnRight:'TurnRightInstruction'};
  function prepare(){loop.stop();map.loadMap(topic===6?3:topic===8||topic===9?8:0);done=false;demo.draw();}
  app.ui.media.playVideo=index=>{topic=index;prepare();status.textContent='Observe o robô e depois experimente no desafio.';};
  const pause=app.ui.media.pauseVideo.bind(app.ui.media);
  app.ui.media.pauseVideo=()=>{pause();loop.stop();};
  document.getElementById('playTutorial').addEventListener('click',()=>{
    prepare();
    const examples=[['walk','walk','light'],['walk','walk','light'],['turnLeft','turnRight'],['walk','walk'],['turnRight','turnRight','turnRight','turnRight'],['turnLeft','turnLeft','turnLeft','turnLeft'],['walk','jump','jump','walk','light'],['walk','walk','light','light','light']];
    const program=topic>=8?[new instructions.RepeatInstruction(7,[new instructions.LightInstruction(),new instructions.WalkInstruction()])]:examples[topic].map(name=>new instructions[types[name]]());
    demo.bot.queueInstructions(program);demo.bot.execute();loop.start();
  });
}
