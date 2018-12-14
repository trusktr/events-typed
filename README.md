# events.ts

A typesafe EventEmitter for TypeScript that wraps Node.js EventEmitter.

Basically this gives you the same `EventEmitter` from Node, so the API is
_almost_ the same, with the only minor difference being that events only take
one argument, not many (`ee.emit('foo', singleArg)` and not `ee.emit('foo', arg1, arg2, arg3)`).

## Why?

When using `@types/node`, event names can be any string and are not checked
against a known list of event names, and event payloads all have type `any`.
Because of this you can not enforce strict typing with Node.js EventEmitter. :(

The advantage of this package over `@types/node` is that event names are checked
against a list of known event names that you define (otherwise you get a type
error if you provide an invalid event name) and event payloads all have types
that you define (and you'll get a type error if you pass a callback that doesn't
have a signature that accepts the payload type).

## Usage

It's easiest to explain with code. `event.ts` lets you do the following:

```ts
import { makeEventEmitterClass } from 'events.ts'

// define the event names and their payloads:
type EventTypes = {
  SOME_EVENT: number
  OTHER_EVENT: string
  ANOTHER_EVENT: undefined
  READONLY_EVENT: ReadonlyArray<number>
}

// parens required, because EventEmitter is a factory that returns a class
const EventEmitter = makeEventEmitterClass<EventTypes>()
const emitter = new EventEmitter()

// GOOD --------------- :
emitter.on('SOME_EVENT', payload => testString(payload))
emitter.on('OTHER_EVENT', payload => testString(payload))
emitter.on('ANOTHER_EVENT', (/* no payload */) => {})
emitter.on('READONLY_EVENT', payload => {
  testReadonlyArray(payload)
})
emitter.emit('SOME_EVENT', 42)
emitter.emit('OTHER_EVENT', 'foo')
emitter.emit('ANOTHER_EVENT')
emitter.emit('READONLY_EVENT', Object.freeze([1, 2, 3]))

// BAD --------------- :
emitter.on('SOME_EVENT', payload => testString(payload)) // ERROR: Argument of type 'number' is not assignable to parameter of type 'string'.
emitter.on('OTHER_EVENT', payload => testNumber(payload)) // ERROR: Argument of type 'string' is not assignable to parameter of type 'number'.
emitter.on('ANOTHER_EVENT', (payload: number) => {}) // ERROR: Argument of type '(payload: number) => void' is not assignable to parameter of type '() => void'.
emitter.on('READONLY_EVENT', (payload: number) => {
  testNumber(payload) // ERROR, payload parameter is not ReadonlyArray<number>
})
emitter.emit('foo', 123) // ERROR: Argument of type '"FOOBAR"' is not assignable to parameter of type '"SOME_EVENT" | "OTHER_EVENT" | "ANOTHER_EVENT" | "READONLY_EVENT"'.
emitter.emit('SOME_EVENT', 'foo') // ERROR: Argument of type '"foo"' is not assignable to parameter of type 'number'.
emitter.emit('OTHER_EVENT', 42) // ERROR: Argument of type '42' is not assignable to parameter of type 'string'.
emitter.emit('ANOTHER_EVENT', 'bar') // ERROR: Expected 1 arguments, but got 2.
emitter.emit('READONLY_EVENT', ['1', '2', '3']) // ERROR: Type 'string' is not assignable to type 'number'.

declare function testNumber(value: number): void
declare function testString(value: string): void
declare function testReadonlyArray(value: ReadonlyArray<number>): void
```

Here's the a simple [playground example](<http://www.typescriptlang.org/play/#src=%2F%2F%20import%20%7BEventEmitter%20as%20NodeEventEmitter%7D%20from%20'events'%0Adeclare%20const%20NodeEventEmitter%3A%20any%20%2F%2F%20%5E%0A%0Atype%20EventTypes%20%3D%20%7B%0A%20%20%20%20SOME_EVENT%3A%20number%0A%20%20%20%20OTHER_EVENT%3A%20string%0A%20%20%20%20ANOTHER_EVENT%3A%20undefined%20%2F%2F%20undefined%20means%20this%20event%20will%20have%20no%20payload%0A%20%20%20%20READONLY_EVENT%3A%20ReadonlyArray%3Cnumber%3E%0A%7D%0A%0Atype%20EventArgs%3CEventTypes%2C%20K%20extends%20keyof%20EventTypes%3E%20%3D%20EventTypes%5BK%5D%20extends%20undefined%20%3F%20%5B%5D%20%3A%20%5BEventTypes%5BK%5D%5D%0A%0Ainterface%20IEventEmitter%3CEventTypes%3E%20%7B%0A%20%20%20%20new%20()%3A%20IEventEmitter%3CEventTypes%3E%0A%20%20%20%20on%3CK%20extends%20keyof%20EventTypes%3E(s%3A%20K%2C%20listener%3A%20(...v%3A%20EventArgs%3CEventTypes%2CK%3E)%20%3D%3E%20void)%3A%20void%3B%0A%20%20%20%20emit%3CK%20extends%20keyof%20EventTypes%3E(s%3A%20K%2C%20...v%3A%20EventArgs%3CEventTypes%2CK%3E)%3A%20void%3B%0A%7D%0A%0Afunction%20makeEventEmitterClass%3CEventTypes%3E()%20%7B%0A%20%20%2F%2F%20merge%20the%20IEventEmitter%20interface%20and%20EventEmitter%20as%20IEventEmitter%0A%20%20%2F%2F%20implementation%20into%20one.%0A%20%20return%20class%20EventEmitter%0A%20%20%20%20extends%20((NodeEventEmitter%20as%20unknown)%20as%20IEventEmitter%3CEventTypes%3E)%0A%20%20%20%20implements%20IEventEmitter%3CEventTypes%3E%20%7B%7D%0A%7D%0A%0Aconst%20EventEmitter%20%3D%20makeEventEmitterClass%3CEventTypes%3E()%0Aconst%20emitter%20%3D%20new%20EventEmitter%3B%0A%0A%2F%2F%20GOOD%3A%0Aemitter.on('SOME_EVENT'%2C%20(payload)%20%3D%3E%20testNumber(payload))%3B%0Aemitter.on('OTHER_EVENT'%2C%20(payload)%20%3D%3E%20testString(payload))%3B%0Aemitter.on('ANOTHER_EVENT'%2C%20(%2F*%20no%20payload%20*%2F)%20%3D%3E%20%7B%7D)%3B%0Aemitter.on('READONLY_EVENT'%2C%20(payload)%20%3D%3E%20%7B%20testReadonlyArray(payload)%20%7D)%3B%0Aemitter.emit('SOME_EVENT'%2C%2042)%0Aemitter.emit('OTHER_EVENT'%2C%20'foo')%0Aemitter.emit('ANOTHER_EVENT')%0Aemitter.emit('READONLY_EVENT'%2C%20Object.freeze(%5B1%2C%202%2C%203%5D))%0A%0A%2F%2F%20BAD%3A%0Aemitter.on('SOME_EVENT'%2C%20(payload)%20%3D%3E%20testString(payload))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'number'%20is%20not%20assignable%20to%20parameter%20of%20type%20'string'.%0Aemitter.on('OTHER_EVENT'%2C%20(payload)%20%3D%3E%20testNumber(payload))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'string'%20is%20not%20assignable%20to%20parameter%20of%20type%20'number'.%0Aemitter.on('ANOTHER_EVENT'%2C%20(payload%3A%20number)%20%3D%3E%20%7B%7D)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'(payload%3A%20number)%20%3D%3E%20void'%20is%20not%20assignable%20to%20parameter%20of%20type%20'()%20%3D%3E%20void'.%0Aemitter.on('READONLY_EVENT'%2C%20(payload%3A%20number)%20%3D%3E%20%7B%20testNumber(payload)%20%7D)%3B%20%2F%2F%20ERROR%2C%20payload%20parameter%20is%20not%20ReadonlyArray%3Cnumber%3E%0Aemitter.emit('FOOBAR'%2C%20123)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'%22FOOBAR%22'%20is%20not%20assignable%20to%20parameter%20of%20type%20'%22SOME_EVENT%22%20%7C%20%22OTHER_EVENT%22%20%7C%20%22ANOTHER_EVENT%22%20%7C%20%22READONLY_EVENT%22'.%0Aemitter.emit('SOME_EVENT'%2C%20'foo')%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'%22foo%22'%20is%20not%20assignable%20to%20parameter%20of%20type%20'number'.%0Aemitter.emit('OTHER_EVENT'%2C%2042)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'42'%20is%20not%20assignable%20to%20parameter%20of%20type%20'string'.%0Aemitter.emit('ANOTHER_EVENT'%2C%20'bar')%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Expected%201%20arguments%2C%20but%20got%202.%0Aemitter.emit('READONLY_EVENT'%2C%20%5B'1'%2C%20'2'%2C%20'3'%5D)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Type%20'string'%20is%20not%20assignable%20to%20type%20'number'.%0A%0Adeclare%20function%20testNumber(value%3A%20number)%3A%20void%0Adeclare%20function%20testString(value%3A%20string)%3A%20void%0Adeclare%20function%20testReadonlyArray(value%3A%20ReadonlyArray%3Cnumber%3E)%3A%20void>) showing the concept (with a subset of the EventEmitter API).

You might be accustomed to using enums for event names, for example something
like the following so that you perhaps get better autocompletion:

```ts
emitter.emit(Events.SOME_EVENT, payload)
```

One way you can achieve this is to also write an enum alongside your event types:

```ts
import { makeEventEmitterClass } from 'events.ts'

// define the event names and their payloads:
type EventTypes = {
  SOME_EVENT: number
  OTHER_EVENT: string
  ANOTHER_EVENT: undefined
  READONLY_EVENT: ReadonlyArray<number>
}

// define an enum so we don't have to pass string literals into API calls
enum Events = {
  SOME_EVENT: number
  OTHER_EVENT: string
  ANOTHER_EVENT: undefined
  READONLY_EVENT: ReadonlyArray<number>
}

// parens required, because EventEmitter is a factory that returns a class
const EventEmitter = makeEventEmitterClass<EventTypes>()
const emitter = new EventEmitter()

emitter.emit(Events.SOME_EVENT, 42) // autocompletion works well
```

([playground example](<http://www.typescriptlang.org/play/#src=%2F%2F%20import%20%7BEventEmitter%20as%20NodeEventEmitter%7D%20from%20'events'%0Adeclare%20const%20NodeEventEmitter%3A%20any%20%2F%2F%20%5E%0A%0Atype%20EventTypes%20%3D%20%7B%0A%20%20%20%20SOME_EVENT%3A%20number%0A%20%20%20%20OTHER_EVENT%3A%20string%0A%20%20%20%20ANOTHER_EVENT%3A%20undefined%20%2F%2F%20undefined%20means%20this%20event%20will%20have%20no%20payload%0A%20%20%20%20READONLY_EVENT%3A%20ReadonlyArray%3Cnumber%3E%0A%7D%0A%0Aenum%20Events%20%7B%0A%20%20%20%20SOME_EVENT%20%3D%20'SOME_EVENT'%2C%0A%20%20%20%20OTHER_EVENT%20%3D%20'OTHER_EVENT'%2C%0A%20%20%20%20ANOTHER_EVENT%20%3D%20'ANOTHER_EVENT'%2C%0A%20%20%20%20READONLY_EVENT%20%3D%20'READONLY_EVENT'%2C%0A%7D%0A%0Atype%20EventArgs%3CEventTypes%2C%20K%20extends%20keyof%20EventTypes%3E%20%3D%20EventTypes%5BK%5D%20extends%20undefined%20%3F%20%5B%5D%20%3A%20%5BEventTypes%5BK%5D%5D%0A%0Ainterface%20IEventEmitter%3CEventTypes%3E%20%7B%0A%20%20%20%20new%20()%3A%20IEventEmitter%3CEventTypes%3E%0A%20%20%20%20on%3CK%20extends%20keyof%20EventTypes%3E(s%3A%20K%2C%20listener%3A%20(...v%3A%20EventArgs%3CEventTypes%2CK%3E)%20%3D%3E%20void)%3A%20void%3B%0A%20%20%20%20emit%3CK%20extends%20keyof%20EventTypes%3E(s%3A%20K%2C%20...v%3A%20EventArgs%3CEventTypes%2CK%3E)%3A%20void%3B%0A%7D%0A%0Afunction%20makeEventEmitterClass%3CEventTypes%3E()%20%7B%0A%20%20%2F%2F%20merge%20the%20IEventEmitter%20interface%20and%20EventEmitter%20as%20IEventEmitter%0A%20%20%2F%2F%20implementation%20into%20one.%0A%20%20return%20class%20EventEmitter%0A%20%20%20%20extends%20((NodeEventEmitter%20as%20unknown)%20as%20IEventEmitter%3CEventTypes%3E)%0A%20%20%20%20implements%20IEventEmitter%3CEventTypes%3E%20%7B%7D%0A%7D%0A%0Aconst%20EventEmitter%20%3D%20makeEventEmitterClass%3CEventTypes%3E()%0Aconst%20emitter%20%3D%20new%20EventEmitter%3B%0A%0A%2F%2F%20GOOD%3A%0Aemitter.on(Events.SOME_EVENT%2C%20(payload)%20%3D%3E%20testNumber(payload))%3B%0Aemitter.on(Events.OTHER_EVENT%2C%20(payload)%20%3D%3E%20testString(payload))%3B%0Aemitter.on(Events.ANOTHER_EVENT%2C%20(%2F*%20no%20payload%20*%2F)%20%3D%3E%20%7B%7D)%3B%0Aemitter.on(Events.READONLY_EVENT%2C%20(payload)%20%3D%3E%20%7B%20testReadonlyArray(payload)%20%7D)%3B%0Aemitter.emit(Events.SOME_EVENT%2C%2042)%0Aemitter.emit(Events.OTHER_EVENT%2C%20'foo')%0Aemitter.emit(Events.ANOTHER_EVENT)%0Aemitter.emit(Events.READONLY_EVENT%2C%20Object.freeze(%5B1%2C%202%2C%203%5D))%0A%0A%2F%2F%20BAD%3A%0Aemitter.on(Events.SOME_EVENT%2C%20(payload)%20%3D%3E%20testString(payload))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'number'%20is%20not%20assignable%20to%20parameter%20of%20type%20'string'.%0Aemitter.on(Events.OTHER_EVENT%2C%20(payload)%20%3D%3E%20testNumber(payload))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'string'%20is%20not%20assignable%20to%20parameter%20of%20type%20'number'.%0Aemitter.on(Events.ANOTHER_EVENT%2C%20(payload%3A%20number)%20%3D%3E%20%7B%7D)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'(payload%3A%20number)%20%3D%3E%20void'%20is%20not%20assignable%20to%20parameter%20of%20type%20'()%20%3D%3E%20void'.%0Aemitter.on(Events.READONLY_EVENT%2C%20(payload%3A%20number)%20%3D%3E%20%7B%20testNumber(payload)%20%7D)%3B%20%2F%2F%20ERROR%2C%20payload%20parameter%20is%20not%20ReadonlyArray%3Cnumber%3E%0Aemitter.emit(Events.FOOBAR%2C%20123)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'%22FOOBAR%22'%20is%20not%20assignable%20to%20parameter%20of%20type%20'%22SOME_EVENT%22%20%7C%20%22OTHER_EVENT%22%20%7C%20%22ANOTHER_EVENT%22%20%7C%20%22READONLY_EVENT%22'.%0Aemitter.emit(Events.SOME_EVENT%2C%20'foo')%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'%22foo%22'%20is%20not%20assignable%20to%20parameter%20of%20type%20'number'.%0Aemitter.emit(Events.OTHER_EVENT%2C%2042)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'42'%20is%20not%20assignable%20to%20parameter%20of%20type%20'string'.%0Aemitter.emit(Events.ANOTHER_EVENT%2C%20'bar')%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Expected%201%20arguments%2C%20but%20got%202.%0Aemitter.emit(Events.READONLY_EVENT%2C%20%5B'1'%2C%20'2'%2C%20'3'%5D)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Type%20'string'%20is%20not%20assignable%20to%20type%20'number'.%0A%0Adeclare%20function%20testNumber(value%3A%20number)%3A%20void%0Adeclare%20function%20testString(value%3A%20string)%3A%20void%0Adeclare%20function%20testReadonlyArray(value%3A%20ReadonlyArray%3Cnumber%3E)%3A%20void>))

But you may notice that if the list of event names gets long, that you'll now
have two lists of events: one for the types, and one for the enum. You might
rather have things be DRY and only mention each event name exactly once instead
of mentioning each event name three times. There a way to do that using a
`class` hack. The above example becomes:

```ts
import { makeEventEmitterClass } from 'events.ts'

// define all event names and types in a class as constructor args:
class EventTypes {
  constructor(
    public SOME_EVENT: number,
    public OTHER_EVENT: string,
    public ANOTHER_EVENT: undefined,
    public READONLY_EVENT: ReadonlyArray<number>,
  ) {}
}

// Make an empty Events object, which will be like an enum
const Events = {} as { [k in keyof EventTypes]: k }

// loop on the keys of a dummy EventTypes instance in order to create the
// enum-like Events object keys.
for (const key in new (EventTypes as any)()) {
  Events[key] = key
}

// parens required, because EventEmitter is a factory that returns a class
const EventEmitter = makeEventEmitterClass<EventTypes>()
const emitter = new EventEmitter()

emitter.emit(Events.SOME_EVENT, 42) // autocompletion works well
```

([playground example](<http://www.typescriptlang.org/play/#src=%2F%2F%20import%20%7BEventEmitter%20as%20NodeEventEmitter%7D%20from%20'events'%0Adeclare%20const%20NodeEventEmitter%3A%20any%20%2F%2F%20%5E%0A%0A%2F%2F%20define%20all%20event%20names%20and%20types%20here.%0Aclass%20EventTypes%20%7B%0A%20%20%20%20constructor(%0A%20%20%20%20%20%20%20%20public%20SOME_EVENT%3A%20number%2C%0A%20%20%20%20%20%20%20%20public%20OTHER_EVENT%3A%20string%2C%0A%20%20%20%20%20%20%20%20public%20ANOTHER_EVENT%3A%20undefined%2C%0A%20%20%20%20%20%20%20%20public%20READONLY_EVENT%3A%20ReadonlyArray%3Cnumber%3E%0A%20%20%20%20)%20%7B%7D%0A%7D%0A%0A%2F%2F%20Events%20will%20be%20like%20an%20enum%20so%20that%20we%20can%20use%20it%20like%0A%2F%2F%20%60.on(Events.SOME_EVENT_NAME%2C%20()%20%3D%3E%20%7B%7D)%60%0Aconst%20Events%20%3D%20%7B%7D%20as%20%7B%20%5Bk%20in%20keyof%20EventTypes%5D%3A%20k%20%7D%0A%0A%2F%2F%20loop%20on%20the%20keys%20of%20a%20dummy%20EventTypes%20instance%20in%20order%20to%20create%20the%0A%2F%2F%20enum-like%20Events%20object.%0Afor%20(const%20key%20in%20new%20(EventTypes%20as%20any))%20%7B%0A%20%20%20%20Events%5Bkey%5D%20%3D%20key%0A%7D%0A%0Atype%20EventArgs%3CEventTypes%2C%20K%20extends%20keyof%20EventTypes%3E%20%3D%20EventTypes%5BK%5D%20extends%20undefined%20%3F%20%5B%5D%20%3A%20%5BEventTypes%5BK%5D%5D%0A%0Ainterface%20IEventEmitter%3CEventTypes%3E%20%7B%0A%20%20%20%20new%20()%3A%20IEventEmitter%3CEventTypes%3E%0A%20%20%20%20on%3CK%20extends%20keyof%20EventTypes%3E(s%3A%20K%2C%20listener%3A%20(...v%3A%20EventArgs%3CEventTypes%2CK%3E)%20%3D%3E%20void)%3A%20void%3B%0A%20%20%20%20emit%3CK%20extends%20keyof%20EventTypes%3E(s%3A%20K%2C%20...v%3A%20EventArgs%3CEventTypes%2CK%3E)%3A%20void%3B%0A%7D%0A%0Afunction%20makeEventEmitterClass%3CEventTypes%3E()%20%7B%0A%20%20%2F%2F%20merge%20the%20IEventEmitter%20interface%20and%20EventEmitter%20as%20IEventEmitter%0A%20%20%2F%2F%20implementation%20into%20one.%0A%20%20return%20class%20EventEmitter%0A%20%20%20%20extends%20((NodeEventEmitter%20as%20unknown)%20as%20IEventEmitter%3CEventTypes%3E)%0A%20%20%20%20implements%20IEventEmitter%3CEventTypes%3E%20%7B%7D%0A%7D%0A%0Aconst%20EventEmitter%20%3D%20makeEventEmitterClass%3CEventTypes%3E()%0Aconst%20emitter%20%3D%20new%20EventEmitter%3B%0A%0A%2F%2F%20GOOD%3A%0Aemitter.on(Events.SOME_EVENT%2C%20(payload)%20%3D%3E%20testNumber(payload))%3B%0Aemitter.on(Events.OTHER_EVENT%2C%20(payload)%20%3D%3E%20testString(payload))%3B%0Aemitter.on(Events.ANOTHER_EVENT%2C%20(%2F*%20no%20payload%20*%2F)%20%3D%3E%20%7B%7D)%3B%0Aemitter.on(Events.READONLY_EVENT%2C%20(payload)%20%3D%3E%20%7B%20testReadonlyArray(payload)%20%7D)%3B%0Aemitter.emit(Events.SOME_EVENT%2C%2042)%0Aemitter.emit(Events.OTHER_EVENT%2C%20'foo')%0Aemitter.emit(Events.ANOTHER_EVENT)%0Aemitter.emit(Events.READONLY_EVENT%2C%20Object.freeze(%5B1%2C%202%2C%203%5D))%0A%0A%2F%2F%20BAD%3A%0Aemitter.on(Events.SOME_EVENT%2C%20(payload)%20%3D%3E%20testString(payload))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'number'%20is%20not%20assignable%20to%20parameter%20of%20type%20'string'.%0Aemitter.on(Events.OTHER_EVENT%2C%20(payload)%20%3D%3E%20testNumber(payload))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'string'%20is%20not%20assignable%20to%20parameter%20of%20type%20'number'.%0Aemitter.on(Events.ANOTHER_EVENT%2C%20(payload%3A%20number)%20%3D%3E%20%7B%7D)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'(payload%3A%20number)%20%3D%3E%20void'%20is%20not%20assignable%20to%20parameter%20of%20type%20'()%20%3D%3E%20void'.%0Aemitter.on(Events.READONLY_EVENT%2C%20(payload%3A%20number)%20%3D%3E%20%7B%20testNumber(payload)%20%7D)%3B%20%2F%2F%20ERROR%2C%20payload%20parameter%20is%20not%20ReadonlyArray%3Cnumber%3E%0Aemitter.emit(Events.FOOBAR%2C%20123)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'%22FOOBAR%22'%20is%20not%20assignable%20to%20parameter%20of%20type%20'%22SOME_EVENT%22%20%7C%20%22OTHER_EVENT%22%20%7C%20%22ANOTHER_EVENT%22%20%7C%20%22READONLY_EVENT%22'.%0Aemitter.emit(Events.SOME_EVENT%2C%20'foo')%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'%22foo%22'%20is%20not%20assignable%20to%20parameter%20of%20type%20'number'.%0Aemitter.emit(Events.OTHER_EVENT%2C%2042)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Argument%20of%20type%20'42'%20is%20not%20assignable%20to%20parameter%20of%20type%20'string'.%0Aemitter.emit(Events.ANOTHER_EVENT%2C%20'bar')%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Expected%201%20arguments%2C%20but%20got%202.%0Aemitter.emit(Events.READONLY_EVENT%2C%20%5B'1'%2C%20'2'%2C%20'3'%5D)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20ERROR%3A%20Type%20'string'%20is%20not%20assignable%20to%20type%20'number'.%0A%0Adeclare%20function%20testNumber(value%3A%20number)%3A%20void%0Adeclare%20function%20testString(value%3A%20string)%3A%20void%0Adeclare%20function%20testReadonlyArray(value%3A%20ReadonlyArray%3Cnumber%3E)%3A%20void>))

## Caveats

- Due to how TypeScript works, it is not possible to implement this feature as
  strictly a type declaration file. It requires runtime output in the form of a
  `class`, and thus can not be simply merged into `@types/node`. See the bottom of
  `src/index.ts` to see the part that is required and which emits the runtime code.
- To keep things DRY, you will have to make a dummy class hack like in the last
  example.
- Symbols for event names are not currently supported.
- Multiple event payload arguments are not currently supported.

## TODO

- [ ] Support Symbol event names (how?)
- [ ] Support multiple event payload args (how?)
