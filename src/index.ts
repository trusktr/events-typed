import * as events from 'events'

// EventArgs is used to create the event payload arguments for methods like
// EventEmitter.emit. This makes it possible to require a payload argument if
// the type is not `undefined`, or to not require an event payload argument if
// the type is `undefined`.
type EventArgs<
  EventTypes,
  K extends keyof EventTypes
> = EventTypes[K] extends undefined ? [] : [EventTypes[K]]

// our own version of EventEmitter with type-safe events (because the
// @types/node definition makes all events type `any`).
export interface IEventEmitter<EventTypes> {
  new (): IEventEmitter<EventTypes>

  addListener<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): this

  on<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): this

  once<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): this

  removeListener<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): this

  removeAllListeners<EventName extends keyof EventTypes>(
    event?: EventName,
  ): this

  emit<EventName extends keyof EventTypes>(
    event: EventName,
    ...args: EventArgs<EventTypes, EventName>
  ): boolean

  eventNames<EventName extends keyof EventTypes>(): Array<EventName>
  setMaxListeners(n: number): this
  getMaxListeners(): number

  listeners<EventName extends keyof EventTypes>(
    event: EventName,
  ): (...args: EventArgs<EventTypes, EventName>) => void[]

  listenerCount<EventName extends keyof EventTypes>(type: EventName): number

  prependListener<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): this

  prependOnceListener<EventName extends keyof EventTypes>(
    event: EventName,
    listener: (...args: EventArgs<EventTypes, EventName>) => void,
  ): this
}

// This creates an EventEmitter class that uses our type definition. The
// implementation still comes from Node's EventEmitter.
//
// eslint-disable-next-line typescript/explicit-function-return-type
export function EventEmitter<EventTypes>() {
  // merge the IEventEmitter interface and EventEmitter as IEventEmitter
  // implementation into one.
  // XXX Is there a better way?
  return class EventEmitter
    extends ((events.EventEmitter as unknown) as IEventEmitter<EventTypes>)
    implements IEventEmitter<EventTypes> {}
}
