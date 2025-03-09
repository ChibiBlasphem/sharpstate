import { batch, computed } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import { type DeepSignal, deepSignal } from 'deepsignal/react';
import type { Provider } from 'react';

import type {
  EnsureSignal,
  InferSharpApi,
  InternalSharpConfig,
  OptionalFactoryWithActions,
  OptionalFactoryWithComputed,
  OptionalSharpApiActions,
  OptionalSharpApiComputed,
  Selector,
  SharpActions,
  SharpApi,
  SharpApiActions,
  SharpApiComputed,
  SharpComputed,
  SharpFactory,
  SharpInitialData,
  SharpInitializer,
  SharpValue,
  StateUpdateFn,
} from './types';
import { createContext } from './utils/context-factory';
import { useRefFn } from './utils/use-ref-fn';

export type { SharpApi, InferSharpApi };

function _internalCreateSharpFactory<
  Initializer extends SharpInitializer,
  Actions extends SharpActions<Initializer> = never,
  Computed extends SharpComputed<Initializer> = never,
>(config: InternalSharpConfig<Initializer, Actions, Computed>): SharpFactory<Initializer, Actions, Computed> {
  type ThisSharpValue = SharpValue<Initializer>;
  type ThisInitialData = SharpInitialData<Initializer>;
  type ThisSharp = SharpApi<ThisSharpValue, Actions, Computed>;

  const initializer = config.initializer as Initializer;
  const Ctx = createContext<ThisSharp>(config.name);
  const useContextValue = () => {
    useSignals();
    return Ctx.useValue();
  };
  const useOptionalContextValue = () => {
    useSignals();
    return Ctx.useOptionalValue();
  };

  return {
    createSharp: function useCreateSharp(...initialData: ThisInitialData): ThisSharp {
      useSignals();
      const stateApi = useRefFn<ThisSharp>(() => {
        const value: DeepSignal<ThisSharpValue> = deepSignal<ThisSharpValue>(initializer(...initialData));

        const actionApi = { value: value as ThisSharpValue, batch };
        let actionsObjBox: Record<string, never> | { actions: SharpApiActions<Actions> } = {};
        if ('actions' in config && config.actions) {
          const configActionObj = config.actions;
          const actions = Object.keys(config.actions);
          const actionsObj = actions.reduce(
            (acc, action) => {
              // @ts-expect-error acc is generic, typescript consider generics indexes access only for read
              acc[action] = (...params: unknown[]) => configActionObj[action](actionApi, ...params);
              return acc;
            },
            {} as SharpApiActions<Actions>,
          );
          actionsObjBox = {
            actions: actionsObj,
          };
        }

        let computedObjBox: Record<string, never> | { computed: SharpApiComputed<Computed> } = {};
        if ('computed' in config && config.computed) {
          const configComputedObj = config.computed;
          const computedProps = Object.keys(config.computed);
          const computedObj = computedProps.reduce(
            (acc, computedProp) => {
              // @ts-expect-error acc is generic, typescript consider generics indexes access only for read
              acc[computedProp] = computed(() => configComputedObj[computedProp](value as ThisSharpValue));
              return acc;
            },
            {} as SharpApiComputed<Computed>,
          );
          computedObjBox = {
            computed: computedObj,
          };
        }

        return {
          value,
          update: (fn: StateUpdateFn<ThisSharpValue>) => {
            batch(() => {
              fn(value as ThisSharpValue);
            });
          },
          select: <T>(fn: Selector<ThisSharpValue, T>) => {
            return fn(value) as EnsureSignal<T>;
          },
          ...(actionsObjBox as OptionalSharpApiActions<Actions>),
          ...(computedObjBox as OptionalSharpApiComputed<Computed>),
        };
      });

      return stateApi.current;
    },
    Provider: Ctx.Provider as Provider<ThisSharp>,
    useSharp: useContextValue,
    useOptionalSharp: useOptionalContextValue,
    select: function useSelector<T>(selector: Selector<ThisSharpValue, T>) {
      const sharp = useContextValue();
      return selector(sharp.value) as EnsureSignal<T>;
    },

    // Chainables
    ...(('actions' in config
      ? {}
      : {
          withActions(actionsRecord) {
            return _internalCreateSharpFactory<Initializer, Actions, Computed>({ ...config, actions: actionsRecord });
          },
        }) as OptionalFactoryWithActions<Initializer, Actions, Computed>),
    ...(('computed' in config
      ? {}
      : {
          withComputed(computedRecord) {
            return _internalCreateSharpFactory<Initializer, Actions, Computed>({ ...config, computed: computedRecord });
          },
        }) as OptionalFactoryWithComputed<Initializer, Actions, Computed>),
  };
}

export function createSharpFactory<Initializer extends SharpInitializer>(config: {
  name: string;
  initializer: Initializer;
}): SharpFactory<Initializer> {
  return _internalCreateSharpFactory<Initializer, never, never>(config);
}
