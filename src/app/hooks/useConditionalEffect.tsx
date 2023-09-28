import { DependencyList, EffectCallback, useEffect, useRef } from "react";

function useConditionalEffect(
  callback: EffectCallback,
  dependencies: DependencyList
) {
  const prevDepsRef = useRef<DependencyList>([]);
  let firstRun = true;

  useEffect(() => {
    let hasChanged = false;

    if (firstRun) {
      firstRun = false;
      hasChanged = true;
    } else {
      for (let i = 0; i < dependencies.length; i++) {
        if (prevDepsRef.current[i] !== dependencies[i]) {
          hasChanged = true;
          break;
        }
      }
    }

    if (hasChanged) {
      callback();
      prevDepsRef.current = dependencies;
    }
  }, dependencies);
}

export default useConditionalEffect;
