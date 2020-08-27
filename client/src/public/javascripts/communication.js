/**
* @module Communication
* @author Eric Udlis
* @description The hub of all incomming and outgoing connections
*/

// TODO basically needs to be rewritten.

import CONSTANTS from './constants.js';

//import io from 'socket.io-client';

//const UDP_SERVER = DGRAM.createSocket('udp4');
const PORT = CONSTANTS.serverAddr.port;
const HOST = CONSTANTS.serverAddr.ip;
const LV_BONE_IP = CONSTANTS.lvBone.ip;
const LV_BONE_PORT = CONSTANTS.lvBone.port;
const HV_BONE_IP = CONSTANTS.hvBone.ip;
const HV_BONE_PORT = CONSTANTS.hvBone.port;
const RECIEVING_EMITTER = {emit: ()=>{}, on: ()=> {}};//new EVENTS.EventEmitter();


// UDP Data Recieving
// TODO re-write for websocket

// UDP_SERVER.on('listening', () => {
//   const address = UDP_SERVER.address();
//   console.log(`UDP Server listening on ${address.address}:${address.port}`);
// });

// UDP_SERVER.on('message', (message) => {
//   const recieved = JSON.parse(message); // Turn String into JSON
//   RECIEVING_EMITTER.emit('dataIn', recieved); // Send it to handler.js
// });

// UDP_SERVER.bind(PORT, HOST);

/**
 * Sends a packet to given ip and port over TCP
 * @param {String} ip IP to send packet to
 * @param {*} port Port to send packet to
 * @param {*} msg  Message to include in packet
 */
export function sendPacket(ip, port, msg) {
  // TODO re-write for websocket
  // const tcpSender = new NET.Socket();
  // tcpSender.connect(port, ip, () => {
  //   // console.log('Connection opened');
  //   console.log(`Sending ${msg} to ${ip}`);
  //   tcpSender.write(msg);
  // });

  // tcpSender.setTimeout(2000);
  // tcpSender.on('data', (e) => {
  //   console.log(`Recieved: ${e}`);
  //   RECIEVING_EMITTER.emit('ok', ip);
  // });

  // tcpSender.on('error', (e) => { // eslint-disable-line no-unused-vars
  //   RECIEVING_EMITTER.emit('Lost', ip);
  // });

  // tcpSender.on('close', () => {
  //   // console.log('Connection Closed'); // Commented out for dev without beaglebone connected
  // });
}

/**
 * Sends a message to the LV beaglebone
 * @param {String} msg Message to send
 */
export function sendLVCommand(msg) {
  return sendPacket(LV_BONE_IP, LV_BONE_PORT, msg);
}

/**
 * Sends a message to the HV beaglebon
 * @param {String} msg Message to send
 */
export function sendHVCommand(msg) {
  return sendPacket(HV_BONE_IP, HV_BONE_PORT, msg);
}

/**
 * Sends ready for pumpdown command
 */
export function sendReadyPump() {
  sendHVCommand('readypump');
};

/**
 * Sends pumpdown command
 */
export function sendPumpDown() {
  sendHVCommand('pumpDown');
};

/**
 * Sends Ready for pumpdown command
 */
export function sendReadyCommand() {
  sendHVCommand('readyCommand');
};

/**
 * Sends Propulsion command
 */
export function sendPropulse() {
  sendHVCommand('propulse');
};
/**
 * Sends Emergency Brake Command
 */
export function sendEBrake() {
  sendHVCommand('emergencyBrake');
};

/**
 * Sends Override state command
 */
export function sendOverride(state) {
  sendHVCommand(`override-${state}`);
};

/**
 * Sends ping message to LV beaglebone
 */
export function sendLVPing() {
  sendLVCommand('ping');
};

/**
 * Sends ping message to HV beaglebone
 */
export function sendHVPing() {
  sendHVCommand('ping');
};

/**
 * Sends enable HV command
 */
export function enableHV() {
  sendHVCommand('hvEnable');
};

/**
 * Sends disable HV command
 */
export function disableHV() {
  sendHVCommand('hvDisable');
};

/**
 * Sends primary brake off command
 */
export function primBrakeOff() {
  sendLVCommand('primBrakeOff');
};

/**
 * Send primary brake on command
 */
export function primBrakeOn() {
  sendLVCommand('primBrakeOn');
};

/**
 * Sends Secondary brake on command
 */
export function secBrakeOn() {
  sendLVCommand('secBrakeOn');
};

/**
 * Sends secondary brake off command
 */
export function secBrakeOff() {
  sendLVCommand('secBrakeOff');
};

/**
 * Send precharge enable command
 */
export function enPrecharge() {
  sendHVCommand('enPrecharge');
};

/**
 * Sends toggle latch command
 * @param state true for on false for off
 */
export function toggleLatch(state) {
  if (state) sendHVCommand('mcuLatchOn');
  else sendHVCommand('mcuLatchOff');
};

/**
 * Sends command torque command
 */
export function commandTorque() {
  sendHVCommand('cmdTorque');
};

/**
 * Sends toggle safety command
 * @param state true of on false for off
 */
export function toggleSafety(state) {
  if (state) {
    sendHVCommand('safetyOn');
  } else {
    sendHVCommand('safetyOff');
  }
};

export const receivedEmitter = RECIEVING_EMITTER;
