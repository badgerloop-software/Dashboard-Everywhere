import StateButton from '../assets/StateButton.js';
import { sendOverride } from './communication.js';
import { fillAllBounds } from '../javascripts/dynamicloading.js';

let STATES = [];
/**
 * Class reperesenting a state on the state machine
 */
class State {
  /**
   * Creates a state
   * @param {String} shortName code name for the state, no spaces
   * @param {String} displayName Display name for the buttons and console logs, any format
   * @param {Button} btn (Optional) Button to assign to state if button is already made,
   * if creating a button assign null
   * @param {String} btnColor Color to create state button
   * @param {Boolean} ishazardous If the state requires confirmation to transition to
   * @param {Boolean} isFault If the state is a fault state
   */
  constructor(shortName, displayName, btn, btnColor, ishazardous, isFault) {
    this.shortname = shortName;
    this.displayName = displayName;
    this.ishazardous = ishazardous;
    this.idNum = STATES.length;
    this.isFault = isFault;
    if (btn) {
      this.btn = btn;
    } else {
      this.btn = new StateButton(shortName, displayName, null, btnColor, ishazardous, this);
    }
    this.active = false;
    STATES.push(this);
  }

  /**
   * Either prompts the user to confirm activation or sets active state
   * @param {HTMLElement} modalTemplate The template of the modal to display
   */
  activate(modalTemplate, fromPod) {
    if (this.ishazardous && !fromPod) {
      this.confirmActive(modalTemplate);
    } else {
      this.setActive();
    }
  }

  /**
   * Sets the state as the active state
   */
  setActive() {
    this.active = true;
    STATES.forEach((state) => {
      state.setInactive();
    });
    this.active = true;
    this.btn.activate();
    sendOverride(this.shortName);
    if (!this.isFault) {
      fillAllBounds(this.shortname);
    }
  }

  /**
   * Sets the state as an inactive state
   */
  setInactive() {
    this.active = false;
    this.btn.deactivate();
  }

  /**
   * Displays a confirmation window before transitioning to state
   * @param {HTMLElement} modalTemplate The template of the modal to display
   * @override
   */
  confirmActive(modalTemplate) {
    let modal = modalTemplate.cloneNode(true);
    document.body.appendChild(modal);
    State.toggleConfirmationModal(modal);
    let button = modal.childNodes[1].childNodes[7];
    let text = modal.childNodes[1].childNodes[5];
    let closeButton = modal.childNodes[1].childNodes[1];
    closeButton.addEventListener('click', () => {
      modal.classList.toggle('show-modal');
      document.body.removeChild(modal);
    });
    button.addEventListener('click', () => { State.toggleConfirmationModal(modal); });
    text.innerHTML = `Are you sure you want to transition to ${this.displayName}?`;
    let state = this;
    button.addEventListener('click', () => {
      state.setActive();
      modal.classList.toggle('show-modal');
      document.body.removeChild(modal);
    });
  }

  /**
   * Toggles showing/hiding a modal
   * @param {HTMLElement} modal The modal to toggle
   */
  static toggleConfirmationModal(modal) {
    modal.classList.toggle('show-modal');
  }

  /**
   * Returns the active state
   * @returns {State} The active state or -1 if there is no active state
   */
  static getActiveState() {
    for (let i = 0; i < STATES.length; i++) {
      if (STATES[i].active) {
        return STATES[i];
      }
    }
    return -1;
  }

  /**
   * Sets the active state there should always be one active state
   * @param {State} state State to set active, either State or idNumber
   * @param {HTMLElement} modal The confirmation Modal
   * @param {Boolean} fromPod If the command is from a pod packet (no confirmation needed)
   */
  static setActiveState(state, modal, fromPod) {
    if (typeof state === 'object') {
      state.activate(modal, fromPod);
    }

    if (typeof state === 'number') {
      STATES[state].activate(modal, fromPod);
    }
  }

  /**
   * Finds the state given the IDNumber
   * @param {Number} id ID of state
   * @returns {State} the state with specified id
   */
  static getStateById(id) {
    return STATES.find(state => state.idNum === id);
  }
}

export default State;
