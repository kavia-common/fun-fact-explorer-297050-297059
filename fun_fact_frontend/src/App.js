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

  const RAINBOW_COLORS = useMemo(
    () => ({
      primary: '#EC4899',
      secondary: '#8B5CF6',
      success: '#10B981',
      error: '#EF4444',
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#111827',
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

  // Inline styles themed by Rainbow Burst
  const styles = useMemo(
    () => ({
      app: {
        minHeight: '100vh',
        background: `radial-gradient(1200px 800px at 10% 10%, ${RAINBOW_COLORS.primary}1A, transparent 40%), radial-gradient(1000px 600px at 90% 20%, ${RAINBOW_COLORS.secondary}14, transparent 45%), ${RAINBOW_COLORS.background}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: RAINBOW_COLORS.text,
        padding: '24px',
      },
      card: {
        background: RAINBOW_COLORS.surface,
        borderRadius: '16px',
        boxShadow:
          '0 10px 25px rgba(0,0,0,0.08), 0 6px 12px rgba(236,72,153,0.12), inset 0 0 0 1px rgba(139,92,246,0.08)',
        maxWidth: '720px',
        width: '100%',
        padding: '28px',
        position: 'relative',
      },
      badge: {
        position: 'absolute',
        top: '-14px',
        left: '24px',
        background: `linear-gradient(135deg, ${RAINBOW_COLORS.primary}, ${RAINBOW_COLORS.secondary})`,
        color: 'white',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '6px 10px',
        borderRadius: '999px',
        boxShadow: '0 6px 14px rgba(236,72,153,0.35)',
      },
      heading: {
        marginTop: '8px',
        marginBottom: '12px',
        fontSize: '24px',
        lineHeight: 1.3,
        fontWeight: 800,
        color: RAINBOW_COLORS.text,
      },
      fact: {
        fontSize: '20px',
        lineHeight: 1.5,
        color: '#374151',
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
        background: `linear-gradient(135deg, ${RAINBOW_COLORS.primary}, ${RAINBOW_COLORS.secondary})`,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 18px',
        fontSize: '16px',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow:
          '0 10px 18px rgba(236,72,153,0.25), 0 6px 14px rgba(139,92,246,0.25), inset 0 0 0 2px rgba(255,255,255,0.08)',
        transition: 'transform 0.08s ease, box-shadow 0.2s ease, opacity 0.2s ease',
        outlineOffset: '3px',
      },
      buttonHover: {
        transform: 'translateY(-1px)',
      },
      buttonActive: {
        transform: 'translateY(0)',
        boxShadow:
          '0 6px 12px rgba(236,72,153,0.2), 0 4px 10px rgba(139,92,246,0.2), inset 0 0 0 2px rgba(255,255,255,0.1)',
      },
      subtle: {
        color: '#6B7280',
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
        color: RAINBOW_COLORS.error,
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
    [RAINBOW_COLORS]
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
          Rainbow Burst
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
              style={styles.statusDot(loading ? RAINBOW_COLORS.secondary : RAINBOW_COLORS.success)}
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
