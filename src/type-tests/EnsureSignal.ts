import type { Signal } from '@preact/signals-react';
import type { EnsureSignal } from '../types';
import type { Equal, Expect } from './utils';

type Obj = { foo: string };
type Sig = Signal<Obj>;

type interface1 = string | undefined;
type interface2 = Obj | undefined;
type interface3 = Sig | undefined;
type interface4 = string;
type interface5 = string | null | undefined;
type interface6 = Sig | null | undefined;
type interface7 = Sig;

export type cases = [
  Expect<Equal<EnsureSignal<interface1>, interface1>>,
  Expect<Equal<EnsureSignal<interface2>, interface2>>,
  Expect<Equal<EnsureSignal<interface3>, Sig>>,
  Expect<Equal<EnsureSignal<interface4>, string>>,
  Expect<Equal<EnsureSignal<interface5>, string | null | undefined>>,
  Expect<Equal<EnsureSignal<interface6>, Sig | null>>,
  Expect<Equal<EnsureSignal<interface7>, Sig>>,
];
