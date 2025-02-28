import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import { createSharpFactory } from 'index';
import type { PropsWithChildren } from 'react';

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

        return <div>{sharp.value.$search}</div>;
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
