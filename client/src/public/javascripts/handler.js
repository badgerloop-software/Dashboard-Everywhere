/**
 * @module Handler
 * @author Eric Udlis, Michael Handler
 * @description Handle all updates and interfacing between the front-end and back-end
 */

import {primBrakeOn, primBrakeOff, secBrakeOn, secBrakeOff, sendLVPing, 
  sendHVPing, sendEBrake, enableHV, disableHV, commandTorque, 
  toggleLatch, enPrecharge, receivedEmitter} from './communication.js';

import {archiveData, isDataRecording, recordingEvent, createCache, normalizePacket, packetHandler, findRenderable} from './datainterfacing.js';

import CONSTANTS from './constants.js';
import {fillAllItems, fillAllTables, stateTimer} from './dynamicloading.js';
import RENDERER from './renderer.js';
import CACHE from './cache.js';
import DATA_RECORDING from './dataRecording.js';

// New OOP stuff
import State from './State.js';
import ControlPanelButton from '../assets/ControlPanelButton.js';
import Timer from './Timer.js';

const D = document;
const TIMEOUT = 5000;
const CONNECTION_CHECK_INTERVAL = 1000;
const AUTOSAVE_INTERVAL = 30000;
const STATE_BUTTONS = [
  ['Power Off', '#C10000'],
  ['Idle', '#3C9159'],
  ['Pumpdown', '#C66553', true],
  ['Propulsion', '#C6A153', true],
  ['Braking', '#34495E'],
  ['Stopped', '#34495E'],
  ['Crawl Precharge', '#C6A153'],
  ['Crawl', '#A84671', true],
  ['Post Run', '#34495E'],
  ['Safe to Approach', '#3C9159'],
  ['Run Fault', 'red', false, true],
  ['Non-Run Fault', 'red', false, true],
];
// [Display Name, btn color, ishazardous, isFault]
const CONTROL_PANEL = document.getElementById('controlpanelBox');
const CONFIRMATION_MODAL = D.querySelector('.confirmationModal');
ControlPanelButton.setModalTemplate(CONFIRMATION_MODAL);

const LV_INDICATOR = D.getElementById('connectionDot1');
const HV_INDICATOR = D.getElementById('connectionDot2');
const RECIEVE_INDICATOR_1 = D.getElementById('link1');
const RECIEVE_INDICATOR_2 = D.getElementById('link2');
const DATA_RECORD_BUTTON = new ControlPanelButton('dataRecord', 'Start Data Recording', CONTROL_PANEL, '#AEA8D3', false);
const ARCHIVE_BUTTON = new ControlPanelButton('archiveData', 'Save Data Recording', CONTROL_PANEL, '#AEA8D3', false);
ARCHIVE_BUTTON.greyOut();
const COMMAND_TORQUE = new ControlPanelButton('cmdTorque', 'Cmd Torque', CONTROL_PANEL, '#F4D76F', true);
const PRIMARY_BRAKE_ON = new ControlPanelButton('primBrakeOn', 'Prim. Brake Act', CONTROL_PANEL, '#34495E', false);
const PRIMARY_BRAKE_OFF = new ControlPanelButton('primBrakeOff', 'Prim. Brake Retr', CONTROL_PANEL, '#34495E', false);
const PRECHARGE_ENABLE = new ControlPanelButton('precharge', 'Precharge', CONTROL_PANEL, '#C6A153', true);
const SECONDARY_BRAKE_ON = new ControlPanelButton('secBrakeOff', 'Sec. Brake Act', CONTROL_PANEL, '#5C97BF', false);
const SECONDARY_BRAKE_OFF = new ControlPanelButton('secBrakeOn', 'Sec. Brake Retr', CONTROL_PANEL, '#5C97BF', false);
const LATCH_ON = new ControlPanelButton('latchOn', 'Latch On', CONTROL_PANEL, '#554188', true);
const HV_ENABLE = new ControlPanelButton('hvEnable', 'HV Enable', CONTROL_PANEL, '#F4D76F', true);
const HV_DISABLE = new ControlPanelButton('hvDisable', 'HV Disable', CONTROL_PANEL, '#F4D76F', false);
const LATCH_OFF = new ControlPanelButton('latchOff', 'Latch off', CONTROL_PANEL, '#554188', true);

const EMERGENCY_STOP_BTN = D.getElementById('estop');
const TABLES_RENDERER = new RENDERER();
const GLOBAL_TIMER = new Timer();
const STATE_TIMER = stateTimer;

let activeTimer = GLOBAL_TIMER;
let udpTimeout;
let udpConnected = false;
let { DEBUG } = /* Boolean(process.env) || */ false;
let boneStatus = [false, false]; // [LV, HV]
let packetCounts = [0, 0]; // [LV, HV]
// eslint-disable-next-line no-unused-vars
let oldCounts = [0, 0];

/**
 * @param  {String} group Group the sensor belongs to
 * @param  {String} sensor Sensor to modify
 */
// Renders latest entry in cace to the tables
function renderData(group, sensor) {
  // Get numbers
  const t = D.getElementById(String(sensor));
  const stored = CACHE[group][sensor];
  // Set number
  if (stored[stored.length - 1] == null) {
    t.innerHTML = 'Not Available';
  } else {
    t.innerHTML = String(stored[stored.length - 1]);
  }
}

// State Machine Control Panel Event Listeners
/**
 * Creates a JSON save labled "Autosave"
 */
function autosave() {
  archiveData('autosave');
}

/**
 * Toggles the primary braking indicators and calls the
 * communication call if noted by call
 * @param {Boolean} state // True for on, false for off
 * @param {Boolean} call
 */
function togglePrimBrake(state, call) {
  if (state) {
    PRIMARY_BRAKE_ON.activate();
    PRIMARY_BRAKE_OFF.deactivate();
    if (call) primBrakeOn();
  } else {
    PRIMARY_BRAKE_OFF.activate();
    PRIMARY_BRAKE_ON.deactivate();
    if (call) primBrakeOff();
  }
}
/**
 * Toggles the secondary braking indicators and calls the
 * communication call if noted by call
 * @param {Boolean} state // True for on, false for off
 * @param {Boolean} call
 */
function toggleSecBrake(state, call) {
  if (state) {
    SECONDARY_BRAKE_ON.activate();
    SECONDARY_BRAKE_OFF.deactivate();
    if (call) secBrakeOn();
  } else {
    SECONDARY_BRAKE_ON.deactivate();
    SECONDARY_BRAKE_OFF.activate();
    if (call) secBrakeOff();
  }
}
/**
 * Checks packet for primary and seconday braking status
 * changes indicators and deletes flags
 * @param {Object} basePacket The original packet
 * @returns {Object} fixedPacket The modified packet
 */
function checkBraking(basePacket) {
  let fixedPacket = basePacket;
  if (basePacket.braking !== undefined) {
    if (basePacket.braking.primBrake === 1) togglePrimBrake(false, false);
    else togglePrimBrake(true, false);
    if (basePacket.braking.secBrake === 1) toggleSecBrake(false, false);
    else toggleSecBrake(true, false);
    delete fixedPacket.braking.primBrake;
    delete fixedPacket.braking.secBrake;
  }
  return fixedPacket;
}

// Connection Indicators
/**
 * Sets recieve indicators and starts/stops timer based on status
 * @param {Boolean} state true for ok false for bad
 */
function setRecieve(state) {
  const status = state ? 'statusGood' : 'statusBad';
  const ageDisplay = D.getElementById('ageDisplay');
  RECIEVE_INDICATOR_1.className = status;
  RECIEVE_INDICATOR_2.className = status;
  ageDisplay.className = status;
  ageDisplay.innerHTML = 'N/A';
  GLOBAL_TIMER.reset();
}

/**
 * Sets the LV indicator
 * @param {Boolean} state true for ok false for bad
 */
function setLVIndicator(state) {
  if (state) LV_INDICATOR.className = 'statusGood';
  else LV_INDICATOR.className = 'statusBad';
}
/**
 *Sets the HV indicator
 * @param {Boolean} state true for ok false for bad
 */
function setHVIndicator(state) {
  if (state) HV_INDICATOR.className = 'statusGood';
  if (!state) HV_INDICATOR.className = 'statusBad';
  if (!state && !DEBUG) State.setActiveState(0, CONFIRMATION_MODAL);
}

/**
 * Sends TCP heartbeats to Pod
 */
function sendHeartbeats() {
  sendLVPing();
  sendHVPing();
}

/**
 * Sets LV and HV indicators based on boneStatus
 */
function checkTransmit() {
  setLVIndicator(boneStatus[0]);
  setHVIndicator(boneStatus[1]);
}

/**
 * Updates lables of tables based on recieving packets or not
 */
function updateLabels() {
  if (oldCounts[0] < packetCounts[0] + 5) {
    // Still Recieving packets
    D.getElementById('motionDisconnected').style.display = 'none';
    D.getElementById('brakingDisconnected').style.display = 'none';
  } else {
    // Haven't recieved packets
    D.getElementById('motionDisconnected').style.display = 'inline';
    D.getElementById('brakingDisconnected').style.display = 'inline';
  }
  if (oldCounts[1] < packetCounts[1] + 5) {
    // Still recieving packets
    D.getElementById('motorDisconnected').style.display = 'none';
    D.getElementById('batteryDisconnected').style.display = 'none';
  } else {
    // Haven't recieved packets
    D.getElementById('motorDisconnected').style.display = 'inline';
    D.getElementById('batteryDisconnected').style.display = 'inline';
  }
  oldCounts[0] = packetCounts[0];
  oldCounts[1] = packetCounts[1];
  /** ***************************
  // return null;
   ***************************** */
}
/**
 * Checks if recieving packets, sends heartbeats to pod, checks if we get call back from pod
 * Updates Table Lables
 */
function podConnectionCheck() {
  sendHeartbeats();
  checkTransmit();
  updateLabels();
}
/**
 * Checks weather given packet is a HV or LV packet and increments counter accordingly
 * @param {Object} input Packet to check
 */
function checkPackets(input) {
  if (input.braking && input.motion) packetCounts[0]++;
  if (input.motor && input.battery) packetCounts[1]++;
}

// Event Listeners
// Changes timer based on user input
document.getElementById('ageDisplay').addEventListener('click', () => {
  if (activeTimer === GLOBAL_TIMER) {
    document.getElementById('ageLabel').innerHTML = 'State Timer';
    activeTimer = STATE_TIMER;
    return;
  }
  if (activeTimer === STATE_TIMER || propTimer) {
    document.getElementById('ageLabel').innerHTML = 'Global Timer';
    activeTimer = GLOBAL_TIMER;
  }
});

// Sends Estop on user click
EMERGENCY_STOP_BTN.addEventListener('click', () => {
  sendEBrake();
});

// Initilization
/**
 * Creates the states and state machine buttons
 */

function setControlPanelListeners() {
  PRIMARY_BRAKE_ON.onClick(() => {
    togglePrimBrake(true, true);
  });

  PRIMARY_BRAKE_OFF.onClick(() => {
    togglePrimBrake(false, true);
  });

  SECONDARY_BRAKE_ON.onClick(() => {
    toggleSecBrake(true, true);
  });

  SECONDARY_BRAKE_OFF.onClick(() => {
    toggleSecBrake(false, true);
  });

  HV_ENABLE.onClick(() => {
    enableHV();
    HV_DISABLE.deactivate();
    HV_ENABLE.activate();
  });

  HV_DISABLE.onClick(() => {
    disableHV();
    HV_DISABLE.activate();
    HV_ENABLE.deactivate();
  });

  COMMAND_TORQUE.onClick(() => {
    commandTorque();
  });

  LATCH_ON.onClick(() => {
    LATCH_ON.activate();
    LATCH_OFF.deactivate();
    toggleLatch(true);
  });

  LATCH_OFF.onClick(() => {
    LATCH_OFF.activate();
    LATCH_ON.deactivate();
    toggleLatch(false);
  });

  PRECHARGE_ENABLE.onClick(() => {
    enPrecharge();
  });

  // Starts the recording of data to dataRecording.js
  DATA_RECORD_BUTTON.onClick(() => {
    if (!isDataRecording) {
      recordingEvent.emit('on'); // Tell DI to run start recording data
      console.log('recording data');
      DATA_RECORD_BUTTON.greyOut();
      ARCHIVE_BUTTON.colorize();
    } else {
      console.log('data is already being recorded');
    }
  });

  // Archives the data from dataRecording.js if data is being recorded
  ARCHIVE_BUTTON.onClick(() => {
    if (isDataRecording) {
      recordingEvent.emit('off'); // Tells DI to stop recording data
      archiveData();
      console.log('archiving data');
      DATA_RECORD_BUTTON.colorize();
      ARCHIVE_BUTTON.greyOut();
    } else {
      console.log('data was not being recorded');
    }
  });
}
function createStateMachineButtons() {
  return new Promise((resolve, reject) => {
    let parent = document.getElementById('statemachineBox');
    if (!parent) reject(new Error('Parent not found'));
    STATE_BUTTONS.forEach((state) => {
      let formattedText = state[0].replace(/ /g, '').toLowerCase();
      let newState = new State(formattedText, state[0], null, state[1], state[2], state[3]);
      newState.btn.setParent(parent);
      newState.btn.onClick(() => {
        State.setActiveState(newState, CONFIRMATION_MODAL);
      });
    });
    State.setActiveState(0);
    resolve(State.getActiveState());
  });
}

/**
 * Function to create the caches and tables and dropdowns of the dash
 */
function createDashboard() {
  return new Promise((resolve, reject) => {
    try {
      createCache();
      createCache(DATA_RECORDING);
      fillAllItems();
      fillAllTables();
    } catch (e) {
      reject(e);
    }
    resolve();
  });
}

/**
 * Function to run at start of dashboard
 */
function init() {
  createDashboard().then(() => {
    // First create the dashboard
    setControlPanelListeners();
    createStateMachineButtons()
      .then(() => {
        // Then create all the state objects
        setInterval(podConnectionCheck, CONNECTION_CHECK_INTERVAL); // Finally set intervals
        // Autosaves on interval
        setInterval(autosave, AUTOSAVE_INTERVAL);
      })
      .catch((err) => {
        throw err;
      });
  });
  GLOBAL_TIMER.display();
  console.log(DEBUG);
}
// Run at init
init();

// Events

// Data in recieved
receivedEmitter.on('dataIn', (input) => {
  if (DEBUG) console.log(input);
  checkPackets(input);
  let fixedPacket = checkBraking(input);
  normalizePacket(fixedPacket);
  // Only start once, when the 'connection' is established
  if (!udpConnected) {
    udpConnected = true;
    setRecieve(true);
    TABLES_RENDERER.startRenderer();
  }

  // Watches for 'connection' timeout
  clearTimeout(udpTimeout);
  udpTimeout = setTimeout(() => {
    udpConnected = false;
    setRecieve(false);
    TABLES_RENDERER.stopRenderer();
  }, TIMEOUT);
});

receivedEmitter.on('Lost', (ip) => {
  if (ip === CONSTANTS.lvBone.ip) {
    if (boneStatus[0]) console.error('lost LV bone');
    boneStatus[0] = false;
  }
  if (ip === CONSTANTS.hvBone.ip) {
    if (boneStatus[1]) console.error('lost LV bone');
    boneStatus[1] = false;
  }
});

receivedEmitter.on('ok', (ip) => {
  if (ip === CONSTANTS.lvBone.ip) {
    boneStatus[0] = true;
  }
  if (ip === CONSTANTS.hvBone.ip) {
    boneStatus[1] = true;
  }
});

packetHandler.on('renderData', () => {
  const renderable = findRenderable();
  const groups = Object.keys(renderable);

  if (activeTimer) activeTimer.display();

  groups.forEach((group) => {
    const sensors = Object.keys(renderable[group]);
    sensors.forEach((sensor) => {
      // Check to see if that particular sensor is being rendered at the time
      try {
        renderData(group, sensor);
      } catch (error) {
        // If not, alert the user and move on
        console.error(`Error: Sensor ${sensor} in ${group} not rendered`);
      }
    });
  });
});
