import { attachTutorial } from '../education/tutorial.js';
import { createStorage } from '../education/storage.js';
import { createObjective } from '../education/objective.js';
import { attachEducationView } from '../education/view.js';
import { attachAccessibleEditor } from '../education/accessible-editor.js';
// Composition root for the game: builds the `app` object by assembling models, UI, and rendering extensions.
import { createAppShell } from "./lightbot.model.game.js";
import { createDirections } from "./lightbot.model.directions.js";
import { createBox } from "./lightbot.model.box.js";
import { createLightBox } from "./lightbot.model.lightbox.js";
import { createBotInstructions } from "./lightbot.model.bot.instructions.js";
import { createBot } from "./lightbot.model.bot.js";
import { createMap } from "./lightbot.model.map.js";
import { createMapState } from "./lightbot.model.map.state.js";
import { createMedals } from "./lightbot.model.medals.js";
import { createAchievements } from "./lightbot.model.achievements.js";

import { Projection } from "./lightbot.view.canvas.projection.js";
import { extendMapView } from "./lightbot.view.canvas.map.js";
import { extendBoxView } from "./lightbot.view.canvas.box.js";
import { createBotAnimations } from "./lightbot.view.canvas.bot.animations.js";
import { extendBotView } from "./lightbot.view.canvas.bot.js";
import { extendMedalsView } from "./lightbot.view.canvas.medals.js";
import { extendAchievementsView } from "./lightbot.view.canvas.achievements.js";

import { createUi } from "./lightbot.view.canvas.ui.js";
import { createEditor } from "./lightbot.view.canvas.ui.editor.js";
import { createDialogs } from "./lightbot.view.canvas.ui.dialogs.js";
import { createMedia } from "./lightbot.view.canvas.ui.media.js";

export function createApp() {
  var app = createAppShell();
  app.fitCanvasToSurface = true;
  app.renderPixelRatio = 2;
  var backing;
  try { backing = localStorage; } catch {}
  app.storage = createStorage(backing);
  app.education = createObjective({ storage: app.storage });

  app.directions = createDirections();

  app.Box = createBox();
  app.LightBox = createLightBox({ Box: app.Box });

  // Bot depends on map access, and map creation calls back into bot.init(). We break the cycle with `getMap()`.
  var botInstructions = createBotInstructions();
  var map = null;

  app.bot = createBot({
    directions: app.directions,
    getMap: function () { return map; },
    instructions: botInstructions,
    LightBox: app.LightBox,
    onMove: function (position) { app.education.move(position); },
    canLight: function () { return app.education.canLight(); },
  });

  map = createMap({ bot: app.bot, Box: app.Box, LightBox: app.LightBox });
  map.state = createMapState({ map: map, LightBox: app.LightBox, education: app.education });
  var originalLoad = map.loadMap, originalReset = map.reset;
  map.loadMap = function (level) { originalLoad(level); app.education.load(level); };
  map.reset = function () { originalReset(); app.education.reset(); };
  map.getMedals = function () { return app.education.medals(); };
  app.map = map;

  // Progress/meta systems (stored in localStorage).
  app.medals = createMedals({ bot: app.bot, map: app.map, storage: app.storage });
  app.achievements = createAchievements({ bot: app.bot, map: app.map, medals: app.medals, storage: app.storage });

  // Rendering: projection + canvas drawing extensions + bot animation tables.
  app.Projection = Projection;
  extendBoxView({ app: app, Box: app.Box, LightBox: app.LightBox });
  extendMapView(app.map);

  app.bot.animations = createBotAnimations();
  extendBotView({
    app: app,
    bot: app.bot,
    map: app.map,
    animations: app.bot.animations,
    instructions: botInstructions,
  });

  // UI: dialogs/media/editor are plain objects; createUi() wires them together and exposes screen functions.
  var dialogs = createDialogs();
  var media = createMedia();
  var editor = createEditor({ map: app.map, instructions: botInstructions, storage: app.storage });

  app.ui = createUi({
    bot: app.bot,
    map: app.map,
    medals: app.medals,
    storage: app.storage,
    achievements: app.achievements,
    media: media,
    editor: editor,
    dialogs: dialogs,
    speed: {
      get: function () { return app.speedMultiplier; },
      set: function (v) { app.speedMultiplier = v; },
    },
  });

  extendMedalsView({
    medals: app.medals,
    map: app.map,
    bot: app.bot,
    dialogs: dialogs,
  });

  extendAchievementsView({
    achievements: app.achievements,
    dialogs: dialogs,
  });

  attachEducationView(app);
  attachAccessibleEditor(app);
  attachTutorial(app);
  return app;
}
