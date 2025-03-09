import type { ReadonlySignal, Signal } from '@preact/signals-react';
import type { DeepSignal } from 'deepsignal/react';
import type { Provider } from 'react';

export type StateUpdateFn<S> = (state: S) => void;
export type SharpApiActions<Actions> = Actions extends Record<string, (...params: any) => void>
  ? {
      [K in keyof Actions]: Actions[K] extends (api: any, ...params: infer Params) => infer R
        ? (...params: Params) => R
        : never;
    }
  : never;
export type SharpApiComputed<Computed> = Computed extends Record<string, (...params: any) => any>
  ? {
      [K in keyof Computed]: Computed[K] extends (...params: any) => infer Ret ? ReadonlySignal<Ret> : never;
    }
  : never;

export type SharpApi<Value, Actions, Computed> = {
  value: DeepSignal<Value>;
  update: (fn: StateUpdateFn<Value>) => void;
  select: <T>(fn: Selector<Value, T>) => EnsureSignal<T>;
} & ([Actions] extends [never] ? {} : { actions: SharpApiActions<Actions> }) &
  ([Computed] extends [never] ? {} : { computed: SharpApiComputed<Computed> });

export type SharpInitializer<Params extends any[] = any[], Ret extends object = any> = (...args: Params) => Ret;
export type SharpValue<Initializer> = Initializer extends SharpInitializer<any, infer Ret> ? Ret : never;
export type SharpInitialData<Initializer> = Initializer extends SharpInitializer<infer Params, any> ? Params : never;

export type ActionApi<Value> = { value: Value; batch: (fn: () => void) => void };
export type SharpActions<Initializer extends SharpInitializer<any, any>> = {
  [k: string]: (api: ActionApi<SharpValue<Initializer>>, ...params: any[]) => any;
};

export type SharpComputed<Initializer extends SharpInitializer<any, any>> = {
  [k: string]: (state: SharpValue<Initializer>) => any;
};

export type WithActions<Initializer extends SharpInitializer<any, any>, Computed extends SharpComputed<Initializer>> = {
  withActions: <Actions extends SharpActions<Initializer>>(
    actions: Actions,
  ) => SharpFactory<Initializer, Actions, Computed>;
};

export type WithComputed<Initializer extends SharpInitializer<any, any>, Actions extends SharpActions<Initializer>> = {
  withComputed: <Computed extends SharpComputed<Initializer>>(
    actions: Computed,
  ) => SharpFactory<Initializer, Actions, Computed>;
};

type GetRidOfUndef<T> = T extends undefined ? never : T;
export type EnsureSignal<T> = [GetRidOfUndef<T>] extends [never]
  ? T
  : Signal<any> extends GetRidOfUndef<T>
    ? GetRidOfUndef<T>
    : T;

// biome-ignore format:
export type SharpFactory<
  Initializer extends SharpInitializer<any[], object>,
  Actions extends SharpActions<Initializer> = never,
  Computed extends SharpComputed<Initializer> = never,
> = {
  createSharp: (...initialData: SharpInitialData<Initializer>) => SharpApi<SharpValue<Initializer>, Actions, Computed>;
  Provider: Provider<SharpApi<SharpValue<Initializer>, Actions, Computed>>;
  useSharp: () => SharpApi<SharpValue<Initializer>, Actions, Computed>;
  useOptionalSharp: () => SharpApi<SharpValue<Initializer>, Actions, Computed> | null;
  select: <T>(selector: Selector<SharpValue<Initializer>, T>) => EnsureSignal<T>;
} & ([Actions] extends [never] ? WithActions<Initializer, Computed> : {})
  & ([Computed] extends [never] ? WithComputed<Initializer, Actions> : {});

export type InferSharpApi<Factory> = Factory extends SharpFactory<infer I, infer A, infer C>
  ? SharpApi<SharpValue<I>, A, C>
  : never;

// biome-ignore format:
export type InternalSharpConfig<
  Initializer extends SharpInitializer<any[], object>,
  Actions extends SharpActions<Initializer> = never,
  Computed extends SharpComputed<Initializer> = never,
> = { name: string; initializer: Initializer }
  & ([Actions] extends [never] ? { actions?: never } : { actions: Actions })
  & ([Computed] extends [never] ? { computed?: never } : { computed: Computed });

export type OptionalFactoryWithActions<
  Initializer extends SharpInitializer<any[], object>,
  Actions extends SharpActions<Initializer> = never,
  Computed extends SharpComputed<Initializer> = never,
> = [Actions] extends [never] ? WithActions<Initializer, Computed> : {};

export type OptionalFactoryWithComputed<
  Initializer extends SharpInitializer<any[], object>,
  Actions extends SharpActions<Initializer> = never,
  Computed extends SharpComputed<Initializer> = never,
> = [Computed] extends [never] ? WithComputed<Initializer, Actions> : {};

export type OptionalSharpApiActions<Actions extends SharpActions<any>> = [Actions] extends [never]
  ? {}
  : { actions: SharpApiActions<Actions> };

export type OptionalSharpApiComputed<Computed extends SharpComputed<any>> = [Computed] extends [never]
  ? {}
  : { computed: SharpApiComputed<Computed> };

export type Selector<Value, T> = (value: DeepSignal<Value>) => T;
