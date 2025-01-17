import { Storage } from './storage';

const DEFAULT_STORAGE_KEY = 'alg:beacon:events';
const EVENT_EXPIRY_DAYS = 30;

function expiry() {
  return Date.now() - EVENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

type BeaconEvent<Event, OptionalParams> = {
  timestamp: ReturnType<typeof Date.now>;
  sent: boolean;
  event: Event;
  optionalParams?: OptionalParams;
};

export class Beacon<Event, OptionalParams> {
  private events: Array<BeaconEvent<Event, OptionalParams>>;
  private STORAGE_KEY: string;

  constructor(storageKey?: string) {
    this.STORAGE_KEY = storageKey || DEFAULT_STORAGE_KEY;
    this.events = Storage.get(this.STORAGE_KEY) || [];
  }

  send(event: Event, optionalParams?: OptionalParams) {
    this.events.push({
      event,
      optionalParams,
      timestamp: Date.now(),
      sent: false,
    });
    this.persistEvents();
    this.flushEvents();
  }

  flushAndPurgeEvents() {
    this.flushEvents().then(() => this.purgeExpiredEvents());
  }

  protected emit(_e: Event, _o?: OptionalParams): Promise<unknown> {
    return new Promise((_, reject) => {
      reject(new Error('emit method not implemented'));
    });
  }

  private persistEvents() {
    Storage.set(this.STORAGE_KEY, JSON.stringify(this.events));
  }

  private async flushEvents() {
    const eventsToEmit: Array<Promise<void>> = [];
    this.events.forEach(({ event, optionalParams, sent }, idx) => {
      if (sent) {
        return;
      }

      eventsToEmit.push(
        this.emit(event, optionalParams).then(() => {
          this.events[idx].sent = true;
          this.persistEvents();
        })
      );
    });

    try {
      return await Promise.all(eventsToEmit);
      // eslint-disable-next-line no-empty
    } catch {}
  }

  private purgeExpiredEvents() {
    const expiryTimestamp = expiry();
    const events = this.events.filter(({ sent, timestamp }) => {
      return !sent || timestamp > expiryTimestamp;
    });

    if (events.length < this.events.length) {
      this.events = events;
      this.persistEvents();
    }
  }
}
