import { reactive } from "vue";

class EventEmitter {
  constructor() {
    this.events = reactive({});
  }

  $on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  $emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(...args));
    }
  }

  $off(event, callback) {
    if (this.events[event]) {
      if (callback) {
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
          this.events[event].splice(index, 1);
        }
      } else {
        delete this.events[event];
      }
    }
  }
}

export const EventBus = new EventEmitter();
