import { abortablePromise } from '../../utils/promises';
import { abortableWait } from '../../utils/wait';

type Fetcher<T> = ({ signal }: { signal: AbortSignal }) => Promise<T>;
export const createAbortabes = <T>(fetcher: Fetcher<T>) => {
  const abortController = new AbortController();

  const abort = () => {
    abortController.abort();
  };

  const isAborted = () => abortController.signal.aborted;

  const abortableFetcher = () => {
    const promisifiedFetcher = async () => await fetcher({ signal: abortController.signal });
    return abortablePromise(promisifiedFetcher(), abortController.signal);
  };

  const wait = (ms: number) => abortableWait(ms, abortController.signal);

  return { abort, isAborted, fetcher: abortableFetcher, wait };
};

export type Abortables = ReturnType<typeof createAbortabes>;
export type AbortablesFetcher<T> = ReturnType<typeof createAbortabes>['fetcher'];
export type AbortablesWait = ReturnType<typeof createAbortabes>['wait'];
export type AbortablesAbort = ReturnType<typeof createAbortabes>['abort'];
export type AbortablesIsAborted = ReturnType<typeof createAbortabes>['isAborted'];
