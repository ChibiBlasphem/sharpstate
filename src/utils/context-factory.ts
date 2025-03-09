import { type Provider, createContext as reactCreateContext, useContext } from 'react';

type Context<T> = { Provider: Provider<T>; useValue: () => T; useOptionalValue: () => T | null };

export function createContext<CtxType>(name: string): Context<CtxType> {
  const uninitValue = Symbol(`Uninit value for ${name}`);
  const Ctx = reactCreateContext<CtxType | typeof uninitValue>(uninitValue);

  const useValue = () => {
    const value = useContext(Ctx);
    if (value === uninitValue) {
      throw `${name}.useState must be used within ${name}.Provider`;
    }
    return value;
  };

  const useOptionalValue = () => {
    const value = useContext(Ctx);
    return value === uninitValue ? null : value;
  };

  return { Provider: Ctx.Provider, useValue, useOptionalValue };
}
