/**
 * @module Renderer
 * @author Eric Udlis
 */
import CONSTANTS from './constants.js';
import {packetHandler} from './datainterfacing.js';
// May want to remove this?

/**
 * @constructor
 * @description Represents a single renderer of tables
 */
export default function Renderer() { // eslint-disable-line
  let self = this;
  this.commands = [];
  this.counter = false;
  this.subCounter = false;
  this.interval = CONSTANTS.renderInterval;
  this.run = false;

  this.newCache = {};
  this.oldCache = {};

  this.registerCommand = (command) => {
    self.commands.push(command);
  }

  this.runCommand = () => {
    self.commands.forEach(command => 
      command()
    )
  };

  this.startRenderer = () => {
    self.run = true;
    self.render();
  };

  this.stopRenderer = () => {
    self.run = false;
    clearTimeout(self.counter);
    clearTimeout(self.subCounter);
  };

  this.setInterval = (newTime) => {
    this.interval = newTime;
    this.stopRenderer();
    this.startRenderer();
  };

  this.render = () => {
    if (self.run) {
      self.counter = setTimeout(function run() {
        self.runCommand();
        self.subCounter = setTimeout(run, self.interval);
      }, self.interval);
    }
  };
};
