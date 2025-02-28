# Sharpstate

![License: MIT](https://img.shields.io/npm/l/sharpstate)

Sharpstate is a **component state** library which aims to make creating and propagating state inside a component tree easier. It focuses on 2 points:

- Make the creation clear and easy to understand
- Handle fine-grained state updates so your components aren't cluttered with unecessary re-rendering.

## Installation

```sh
npm install sharpstate
```

## Usage

Sharpstate works by creating a factory which allows you to create a mutable state scoped to a component.

```tsx
import { createSharpFactory } from 'sharpstate';

const CounterSharpFactory = createSharpFactory({
  name: 'Counter',
  initializer: (initialCount: number) => {
    return { count: initialCount },
  },
});

export function MyComponent() {
  const sharp = CounterSharpFactory.createSharp(0);

  return <div>Counter: {sharp.value.$count}</div>
}
```

Things to note:

- The `initializer` parameter can be any function returning your state, it can take none to any parameters you want which are then needed when calling `Factory.createSharp`
- We are using [deepsignal](https://github.com/luisherranz/deepsignal) to represent your state, so to get and display the reactive value of your state you need to prefix your prop with a `$` sign.  
  In this example our state is `{ count: number }` so to display the count you need to use `sharp.value.$count` instead of `sharp.value.count` (the latest won't be able to subscribe to changes).

## Features

### Actions

You can specify actions on your sharp. Actions are basically functions that have access to your sharp api and that you can execute to either modify your state or trigger a side effect.  
Setting up actions is as easy as chaining `withActions` after `createSharpFactory`

```tsx
import { createSharpFactory } from "sharpstate";

const CounterSharpFactory = createSharpFactory({
  name: "Counter",
  initializer: (initialCount: number) => {
    return { counter: initialCount };
  },
}).withActions({
  increment(api, step = 1) {
    api.value.count += step;
  },
  decrement(api, step = 1) {
    api.value.count -= step;
  },
});

export function MyComponent() {
  const sharp = CounterSharpFactory.createSharp(0);

  return (
    <div>
      <div>Counter: {sharp.value.$count}</div>
      <div>
        <button type="button" onClick={() => sharp.actions.increment()}>
          Increment
        </button>
        <button type="button" onClick={() => sharp.actions.decrement()}>
          Decrement
        </button>
      </div>
    </div>
  );
}
```

### Computed values

Computed values are values which are evaluated when a value in your state changes. You can set up computed values by chaining `withComputed` on your factory.

```tsx
import { createSharpFactory } from "sharpstate";

const CounterSharpFactory = createSharpFactory({
  name: "Counter",
  initializer: (initialCount: number) => {
    return { count: initialCount };
  },
})
  .withActions({
    increment(api, step = 1) {
      api.value.count += step;
    },
    decrement(api, step = 1) {
      api.value.count -= step;
    },
  })
  .withComputed({
    doubled(state) {
      return state.count * 2;
    },
    squared(state) {
      return state.count ** 2;
    },
  });

export function MyComponent() {
  const sharp = CounterSharpFactory.createSharp(0);

  return (
    <div>
      <div>
        <span>Counter: {sharp.value.$count}</span>
        <span>Double: {sharp.computed.doubled}</span>
        <span>Squared: {sharp.computed.squared}</span>
      </div>
      <div>
        <button type="button" onClick={() => sharp.actions.increment()}>
          Increment
        </button>
        <button type="button" onClick={() => sharp.actions.decrement()}>
          Decrement
        </button>
      </div>
    </div>
  );
}
```

### Propagating your sharp

Sharpstate factory provides you a way to propagate your state with a Context typed based on your state. This is quite useful when you want to create a composable API for your component (such as a Menu for example).  
To propagate your state, use `YourFactory.Provider` component and retrieve either your entire sharp with `YourFactory.useSharp()` or a dedicated state value with `YourFactory.select(selector)`;

```tsx
import { createSharpFactory } from "sharpstate";

const CounterSharpFactory = createSharpFactory({
  name: "Counter",
  initializer: (initialCount: number) => {
    return { count: initialCount };
  },
});

export function Counter({ children }: { children: ReactNode }) {
  const sharp = CounterSharpFactory.createSharp(0);
  return (
    <CounterSharpFactory.Provider value={sharp}>
      {children}
    </CounterSharpFactory.Provider>
  );
}

export function CounterDisplayer() {
  const sharp = CounterSharpFactory.useSharp();

  return <div>{sharp.value.$count}</div>;
}

export function CounterButtons() {
  const count = CounterSharpFactory.select((value) => value.$count); // Selecting a Signal allows you to mutate it

  return <button onClick={() => (count.value += 1)}>Increment</button>;
}

// Usage
const MyComponent = () => {
  return (
    <Counter>
      <CounterDisplayer />
      <CounterButtons />
    </Counter>
  );
};
```
