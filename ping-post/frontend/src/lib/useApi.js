import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Fetches from the backend and tracks loading/error state.
 *
 * Two rules keep the screens calm:
 *
 *   1. Data already on screen stays there while a refetch runs. `loading`
 *      is only true when there is nothing to show yet, so changing a
 *      filter or coming back to a page never flashes a spinner over
 *      figures that are still valid. `refreshing` says a fetch is in
 *      flight behind existing data.
 *
 *   2. A failed refetch keeps the previous data and sets `error`
 *      alongside it. The page can show a small "could not refresh"
 *      notice instead of replacing a whole panel of numbers with a
 *      red box -- which is what a two-second backend restart used to do.
 *
 *   const { data, loading, refreshing, error, reload } = useApi(
 *     () => api.summary({ from, to }),
 *     [from, to],
 *   )
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, refreshing: false, error: null })

  // Guards against a slow earlier request landing after a newer one and
  // overwriting fresher data.
  const seq = useRef(0)
  const fn = useRef(fetcher)
  fn.current = fetcher

  const run = useCallback(() => {
    if (!enabled) {
      setState({ data: null, loading: false, refreshing: false, error: null })
      return
    }

    const mine = ++seq.current
    setState((s) => ({ ...s, loading: s.data == null, refreshing: s.data != null, error: null }))

    Promise.resolve()
      .then(() => fn.current())
      .then((data) => {
        if (mine === seq.current) setState({ data, loading: false, refreshing: false, error: null })
      })
      .catch((error) => {
        if (mine === seq.current) setState((s) => ({ data: s.data, loading: false, refreshing: false, error }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  useEffect(run, [run])

  return { ...state, reload: run }
}
