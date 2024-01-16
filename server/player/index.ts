import 'player/loading';
import 'player/events';
import 'player/commands';
import { OxPlayer } from './class';

/**
 * Sets an interval to save every 10 minutes.
 * @todo Consider performance on servers with a high player-count.
 * Multiple staggered saves may improve load.
 */
setInterval(() => OxPlayer.saveAll(), 600000);
