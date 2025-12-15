import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  /**
   * This app shows a centered card containing a fun fact with a "New Fun Fact" button.
   * - Tries to fetch a random fun fact from `${REACT_APP_API_BASE}/fun-facts/random` if REACT_APP_API_BASE is defined.
   * - Falls back to a small local list if env is absent or fetch fails.
   * - Includes loading, error states, and accessible live region updates.
   * - Uses Rainbow Burst theme colors (#EC4899 primary, #8B5CF6 secondary, #10B981 success).
   */

  const MONO = useMemo(
    () => ({
      background: '#ffffff',     // page background
      surface: '#ffffff',        // card
      border: '#e5e7eb',         // subtle borders
      text: '#111827',           // primary text
      textSecondary: '#4b5563',  // secondary text
      accent: '#111827',         // button border/fill, outlines
      error: '#111827',          // readable error text in mono
      success: '#111827'         // reuse accent for status dot in mono
    }),
    []
  );

  // Local fallback facts
  const localFacts = useMemo(
    () => [
      'Honey never spoils — archaeologists found pots of it in ancient tombs!',
      'Octopuses have three hearts and blue blood.',
      'Bananas are berries, but strawberries are not.',
      'A group of flamingos is called a “flamboyance.”',
      'Sea otters hold hands when they sleep so they don’t drift apart.',
      'Cows have best friends and can become stressed when separated.',
      'The Eiffel Tower can be 15 cm taller during hot days.',
      'There are more stars in the universe than grains of sand on Earth.',
    ],
    []
  );

  const [currentFact, setCurrentFact] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const liveRegionRef = useRef(null);

  const apiBase = process.env.REACT_APP_API_BASE;

  // Utility to pick a random fact from local list
  const getRandomLocalFact = useCallback(() => {
    const idx = Math.floor(Math.random() * localFacts.length);
    return localFacts[idx];
  }, [localFacts]);

  // Fetch with timeout helper
  const fetchWithTimeout = useCallback(async (url, options = {}, timeoutMs = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      return resp;
    } finally {
      clearTimeout(id);
    }
  }, []);

  const updateLiveRegion = useCallback((text) => {
    // help screen readers announce updated fact
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
      // Flush to ensure SR re-announce
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = text;
        }
      }, 50);
    }
  }, []);

  const setFactAndAnnounce = useCallback((fact) => {
    setCurrentFact(fact);
    updateLiveRegion(fact);
  }, [updateLiveRegion]);

  // PUBLIC_INTERFACE
  const getNewFact = useCallback(async () => {
    setErrorMsg('');
    setLoading(true);

    // If no API base configured, fallback immediately
    if (!apiBase) {
      const fallback = getRandomLocalFact();
      setFactAndAnnounce(fallback);
      setLoading(false);
      return;
    }

    try {
      const url = `${apiBase.replace(/\/+$/, '')}/fun-facts/random`;
      const resp = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 6000);

      if (!resp.ok) {
        throw new Error(`API responded with status ${resp.status}`);
      }

      // Try to parse JSON; support both { fact: string } or { data: { fact: string } } or plain text
      let factText = '';
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        if (typeof data === 'string') {
          factText = data;
        } else if (data && typeof data.fact === 'string') {
          factText = data.fact;
        } else if (data && data.data && typeof data.data.fact === 'string') {
          factText = data.data.fact;
        }
      } else {
        factText = await resp.text();
      }

      if (!factText || typeof factText !== 'string') {
        throw new Error('Malformed API response');
      }

      setFactAndAnnounce(factText.trim());
    } catch (err) {
      // graceful fallback to local facts
      const fallback = getRandomLocalFact();
      setFactAndAnnounce(fallback);
      setErrorMsg('Showing a local fun fact because the network request failed.');
      // Note: We still consider this a successful display, so keep the fact updated.
    } finally {
      setLoading(false);
    }
  }, [apiBase, fetchWithTimeout, getRandomLocalFact, setFactAndAnnounce]);

  // Load initial fact
  useEffect(() => {
    // upon first mount, load a random local fact to avoid blank UI
    const initial = getRandomLocalFact();
    setFactAndAnnounce(initial);
  }, [getRandomLocalFact, setFactAndAnnounce]);

  // Inline styles themed by Monochrome
  const styles = useMemo(
    () => ({
      app: {
        minHeight: '100vh',
        background: MONO.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: MONO.text,
        padding: '24px',
      },
      card: {
        background: MONO.surface,
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
        border: `1px solid ${MONO.border}`,
        maxWidth: '720px',
        width: '100%',
        padding: '28px',
        position: 'relative',
      },
      badge: {
        position: 'absolute',
        top: '-14px',
        left: '24px',
        background: '#111827',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '6px 10px',
        borderRadius: '999px',
        boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
      },
      heading: {
        marginTop: '8px',
        marginBottom: '12px',
        fontSize: '24px',
        lineHeight: 1.3,
        fontWeight: 800,
        color: MONO.text,
      },
      fact: {
        fontSize: '20px',
        lineHeight: 1.5,
        color: MONO.textSecondary,
        marginTop: '8px',
        marginBottom: '20px',
      },
      controls: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      },
      button: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: '#ffffff',
        color: MONO.accent,
        border: `2px solid ${MONO.accent}`,
        borderRadius: '12px',
        padding: '12px 18px',
        fontSize: '16px',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 3px 0 rgba(0,0,0,0.08)',
        transition: 'transform 0.08s ease, box-shadow 0.2s ease, opacity 0.2s ease, background-color 0.15s ease, color 0.15s ease',
        outlineOffset: '3px',
      },
      buttonHover: {
        transform: 'translateY(-1px)',
        background: MONO.accent,    // invert on hover
        color: '#ffffff',
      },
      buttonActive: {
        transform: 'translateY(0)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
      },
      subtle: {
        color: MONO.textSecondary,
        fontSize: '14px',
      },
      statusRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginLeft: 'auto',
      },
      statusDot: (color) => ({
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 0 3px ${color}22`,
      }),
      errorText: {
        color: MONO.error,
        fontSize: '14px',
        fontWeight: 600,
      },
      srOnly: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      },
    }),
    [MONO]
  );

  const [isHover, setIsHover] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const buttonStyle = {
    ...styles.button,
    ...(isHover ? styles.buttonHover : {}),
    ...(isActive ? styles.buttonActive : {}),
  };

  return (
    <main style={styles.app}>
      <section style={styles.card} aria-labelledby="funfact-heading">
        <span style={styles.badge} aria-hidden="true">
          Monochrome
        </span>
        <h1 id="funfact-heading" style={styles.heading}>
          Did you know?
        </h1>

        {/* Live region for assistive technologies */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          style={styles.srOnly}
        />

        <p style={styles.fact}>{currentFact}</p>

        <div style={styles.controls}>
          <button
            type="button"
            style={buttonStyle}
            aria-label="Get a new fun fact"
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => {
              setIsHover(false);
              setIsActive(false);
            }}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsActive(true);
            }}
            onKeyUp={() => setIsActive(false)}
            onClick={getNewFact}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'New Fun Fact'}
            {!loading && (
              <span aria-hidden="true" role="img">
                🎉
              </span>
            )}
          </button>

          <div style={styles.statusRow} aria-live="polite">
            <span
              style={styles.statusDot(MONO.success)}
              aria-hidden="true"
            />
            <span style={styles.subtle}>
              {loading ? 'Fetching from API or local list…' : apiBase ? 'Ready (API with fallback)' : 'Ready (local list)'}
            </span>
          </div>
        </div>

        {errorMsg ? <div role="status" style={styles.errorText}>{errorMsg}</div> : null}
      </section>
    </main>
  );
}

export default App;
