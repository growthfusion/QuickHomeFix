import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Fetches from the backend and tracks loading/error state.
 *
 * Every call reaches LeadProsper through the backend, so a failure here
 * is a real upstream condition -- a bad date range, a rate limit -- not
 * a blip to hide. The error is surfaced with its message so the page
 * can say what went wrong instead of showing an empty table that reads
 * as "no data".
 *
 *   const { data, loading, error, reload } = useApi(
 *     () => api.summary({ from, to }),
 *     [from, to],
 *   )
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null })

  // Guards against a slow earlier request landing after a newer one and
  // overwriting fresher data -- easy to hit when someone changes the
  // date range twice quickly.
  const seq = useRef(0)
  const fn = useRef(fetcher)
  fn.current = fetcher

  const run = useCallback(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }

    const mine = ++seq.current
    setState((s) => ({ ...s, loading: true, error: null }))

    Promise.resolve()
      .then(() => fn.current())
      .then((data) => {
        if (mine === seq.current) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (mine === seq.current) setState({ data: null, loading: false, error })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  useEffect(run, [run])

  return { ...state, reload: run }
}
