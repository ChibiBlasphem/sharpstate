import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import { createSharpFactory } from 'index';
import type { PropsWithChildren, ReactNode } from 'react';

describe('Simple Sharp', () => {
  describe('should display value', () => {
    it('no initial data', () => {
      const TEXT = 'Hello world';
      const TestSharpFactory = createSharpFactory({
        name: 'TestSharpFactory',
        initializer: () => ({
          search: TEXT,
        }),
      });

      const Element = () => {
        const sharp = TestSharpFactory.createSharp();
        const search = sharp.select((s) => s.$search);

        return <div>{search}</div>;
      };

      const root = render(<Element />);
      expect(root.getByText(TEXT)).toBeInTheDocument();
    });

    it('with initial data', () => {
      const TEXT = 'Hello world';
      const TestSharpFactory = createSharpFactory({
        name: 'TestSharpFactory',
        initializer: (initialValue: string) => ({
          search: initialValue,
        }),
      });

      const Element = () => {
        const sharp = TestSharpFactory.createSharp(TEXT);

        return <div>{sharp.value.search}</div>;
      };

      const root = render(<Element />);
      expect(root.getByText(TEXT)).toBeInTheDocument();
    });

    it('inside a sharp provider/context', () => {
      const TEXT = 'Hello world';
      const TestSharpFactory = createSharpFactory({
        name: 'TestSharpFactory',
        initializer: () => ({
          search: TEXT,
        }),
      });

      const Element = ({ children }: PropsWithChildren) => {
        const sharp = TestSharpFactory.createSharp();

        return <TestSharpFactory.Provider value={sharp}>{children}</TestSharpFactory.Provider>;
      };
      const SubElement = () => {
        const search = TestSharpFactory.select((value) => value.search);

        return <div>{search}</div>;
      };

      const root = render(
        <Element>
          <SubElement />
        </Element>,
      );
      expect(root.getByText(TEXT)).toBeInTheDocument();
    });
  });
});

describe('With actions', () => {
  it('should display the new value and not render the display component', async () => {
    const TEXT = 'Hello world';
    const AFTER_TEXT = 'Goodbye world';

    let RENDER_COUNT = 0;

    const TestSharpFactory = createSharpFactory({
      name: 'TestSharpFactory',
      initializer: () => ({
        search: TEXT,
      }),
    }).withActions({
      setSearch: (api, value: string) => {
        api.value.search = value;
      },
    });

    const Element = ({ children }: PropsWithChildren) => {
      const sharp = TestSharpFactory.createSharp();

      return <TestSharpFactory.Provider value={sharp}>{children}</TestSharpFactory.Provider>;
    };
    const EditElement = () => {
      const sharp = TestSharpFactory.useSharp();

      return (
        <button type="button" onClick={() => sharp.actions.setSearch(AFTER_TEXT)}>
          Change search
        </button>
      );
    };
    const DisplayElement = () => {
      const search = TestSharpFactory.select((state) => state.$search);

      ++RENDER_COUNT;

      return <div>{search}</div>;
    };

    const root = render(
      <Element>
        <EditElement />
        <DisplayElement />
      </Element>,
    );

    expect(root.getByText(TEXT)).toBeInTheDocument();
    root.getByRole('button').click();
    expect(await root.findByText(AFTER_TEXT)).toBeInTheDocument();
    expect(RENDER_COUNT).toBe(1);
  });
});

describe('With computed', () => {
  it('should properly display the computed prop', async () => {
    const FIRST_NAME = 'John';
    const LAST_NAME = 'Doe';
    const NEW_FIRST_NAME = 'Jane';

    let RENDER_COUNT = 0;

    const TestSharpFactory = createSharpFactory({
      name: 'TestSharpFactory',
      initializer: () => ({
        firstName: FIRST_NAME,
        lastName: LAST_NAME,
      }),
    })
      .withActions({
        setFirstName: (api, value: string) => {
          api.value.firstName = value;
        },
      })
      .withComputed({
        fullName: (state) => `${state.firstName} ${state.lastName}`,
      });

    const Element = ({ children }: PropsWithChildren) => {
      const sharp = TestSharpFactory.createSharp();

      return <TestSharpFactory.Provider value={sharp}>{children}</TestSharpFactory.Provider>;
    };
    const EditElement = () => {
      const sharp = TestSharpFactory.useSharp();

      return (
        <button type="button" onClick={() => sharp.actions.setFirstName(NEW_FIRST_NAME)}>
          Change search
        </button>
      );
    };
    const DisplayElement = () => {
      const sharp = TestSharpFactory.useSharp();

      ++RENDER_COUNT;

      return <div>{sharp.computed.fullName}</div>;
    };

    const root = render(
      <Element>
        <EditElement />
        <DisplayElement />
      </Element>,
    );

    expect(root.getByText(`${FIRST_NAME} ${LAST_NAME}`)).toBeInTheDocument();
    root.getByRole('button').click();
    expect(await root.findByText(`${NEW_FIRST_NAME} ${LAST_NAME}`)).toBeInTheDocument();
    expect(RENDER_COUNT).toBe(1);
  });
});

describe('Examples', () => {
  it('Simple test', () => {
    const SharpFactory = createSharpFactory({
      name: 'Counter',
      initializer: (initialCount: number) => ({ count: initialCount }),
    });

    const CounterComponent = () => {
      const sharp = SharpFactory.createSharp(0);
      return <div>Counter: {sharp.value.$count}</div>;
    };

    const root = render(<CounterComponent />);

    expect(root.getByText('Counter: 0')).toBeInTheDocument();
  });

  it('With actions', async () => {
    const SharpFactory = createSharpFactory({
      name: 'Counter',
      initializer: (initialCount: number) => ({ count: initialCount }),
    }).withActions({
      increment(api, step = 1) {
        api.value.count += step;
      },
      decrement(api, step = 1) {
        api.value.count -= step;
      },
    });

    const CounterComponent = () => {
      const sharp = SharpFactory.createSharp(0);

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
    };

    const root = render(<CounterComponent />);
    expect(root.getByText('Counter: 0')).toBeInTheDocument();

    root.getByText('Increment').click();
    expect(await root.findByText('Counter: 1')).toBeInTheDocument();

    root.getByText('Decrement').click();
    expect(await root.findByText('Counter: 0')).toBeInTheDocument();
  });

  it('With computed', async () => {
    const SharpFactory = createSharpFactory({
      name: 'Counter',
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

    const CounterComponent = () => {
      const sharp = SharpFactory.createSharp(0);

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
    };

    const root = render(<CounterComponent />);
    expect(root.getByText('Counter: 0')).toBeInTheDocument();
    expect(root.getByText('Double: 0')).toBeInTheDocument();
    expect(root.getByText('Squared: 0')).toBeInTheDocument();

    root.getByText('Increment').click();
    expect(await root.findByText('Counter: 1')).toBeInTheDocument();
    expect(await root.findByText('Double: 2')).toBeInTheDocument();
    expect(await root.findByText('Squared: 1')).toBeInTheDocument();

    root.getByText('Increment').click();
    root.getByText('Increment').click();
    expect(await root.findByText('Counter: 3')).toBeInTheDocument();
    expect(await root.findByText('Double: 6')).toBeInTheDocument();
    expect(await root.findByText('Squared: 9')).toBeInTheDocument();
  });

  it('Composability', async () => {
    const CounterSharpFactory = createSharpFactory({
      name: 'Counter',
      initializer: (initialCount: number) => {
        return { count: initialCount };
      },
    });

    const Counter = ({ children }: { children: ReactNode }) => {
      const sharp = CounterSharpFactory.createSharp(0);
      return <CounterSharpFactory.Provider value={sharp}>{children}</CounterSharpFactory.Provider>;
    };

    const CounterDisplayer = () => {
      const sharp = CounterSharpFactory.useSharp();

      return <div>Counter: {sharp.value.$count}</div>;
    };

    const CounterButtons = () => {
      const count = CounterSharpFactory.select((value) => value.$count); // Selecting a Signal allows you to mutate it

      return (
        <button
          type="button"
          onClick={() => {
            count.value += 1;
          }}
        >
          Increment
        </button>
      );
    };

    const TestComponent = () => {
      return (
        <Counter>
          <CounterDisplayer />
          <CounterButtons />
        </Counter>
      );
    };

    const root = render(<TestComponent />);
    expect(root.getByText('Counter: 0')).toBeInTheDocument();

    root.getByText('Increment').click();
    expect(await root.findByText('Counter: 1')).toBeInTheDocument();
  });
});
