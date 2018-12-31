import * as events from 'events'

// EventArgs is used to create the event payload arguments for methods like
// EventEmitter.emit. This makes it possible to require a payload argument if
// the type is not `undefined`, or to not require an event payload argument if
// the type is `undefined`.
// prettier-ignore
type EventArgs<
  EventTypes,
  K extends keyof EventTypes
> = EventTypes[K] extends undefined
  ? []
  : EventTypes[K] extends any[]
    ? EventTypes[K]
    : [EventTypes[K]]

// our own version of EventEmitter with type-safe events (because the
// @types/node definition makes all events type `any`).
export interface IEventEmitter<EventTypes> {
  new (): IEventEmitter<EventTypes>

  addListener<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): IEventEmitter<EventTypes>

  on<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): IEventEmitter<EventTypes>

  once<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): IEventEmitter<EventTypes>

  removeListener<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): IEventEmitter<EventTypes>

  removeAllListeners<EventName extends keyof EventTypes>(
    event?: EventName,
  ): IEventEmitter<EventTypes>

  emit<EventName extends keyof EventTypes>(
    event: EventName,
    ...args: EventArgs<EventTypes, EventName>
  ): boolean

  eventNames<EventName extends keyof EventTypes>(): Array<EventName>
  setMaxListeners(n: number): IEventEmitter<EventTypes>
  getMaxListeners(): number

  listeners<EventName extends keyof EventTypes>(
    event: EventName,
  ): (...args: EventArgs<EventTypes, EventName>) => void[]

  listenerCount<EventName extends keyof EventTypes>(type: EventName): number

  prependListener<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): IEventEmitter<EventTypes>

  prependOnceListener<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): IEventEmitter<EventTypes>
}

// This creates an EventEmitter class that uses our type definition. The
// implementation still comes from Node's EventEmitter.
//
// eslint-disable-next-line typescript/explicit-function-return-type
export function makeEventEmitterClass<EventTypes>() {
  // merge the IEventEmitter interface and EventEmitter as IEventEmitter
  // implementation into one.
  // XXX Is there a better way?
  const EventEmitter = class extends ((events.EventEmitter as unknown) as IEventEmitter<
    EventTypes
  >) {}
  // implements IEventEmitter<EventTypes> {}

  return EventEmitter
}
