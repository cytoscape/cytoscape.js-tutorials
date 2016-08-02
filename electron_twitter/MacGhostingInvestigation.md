# Electron debugging notes
## Old versions
- Electron 1.0.2 (Node 5.10.0, Chromium 49), Cytoscape.js 2.4.9
  - Ghosting does not occur; however, significant lag when moving large graphs (stutters, estimating <10 FPS)

## New versions
- Electron 1.3.1 (Node 6.3.0, Chromium 52), Cytoscape.js 2.7.7
  - Ghosting occurs. Once ghosting has occurred, animation is much smoother (visually no lag)

## Moving up Electron version
- Electron 1.1.3 (Node 6.1.0, Chromium 50), Cytoscape.js 2.4.9
  - No ghosting; performance most like the Old Version combo.
- Electron 1.3.1 (Node 6.3.0, Chromium 52), Cytoscape 2.4.9
  - No ghosting; performance most like the Old Version combo.
- Conclusion: issue seems to be with Cytoscape.js as all Electron versions have same behavior.

## Moving up Cytoscape.js version
- Electron 1.3.1 (Node 6.3.0, Chromium 52), Cytoscape.js 2.5.5
  - No ghosting; performance most like the Old Version combo.
- Electron 1.3.1 (Node 6.3.0, Chromium 52), Cytoscape.js 2.6.12
  - No ghosting; performance most like the Old Version combo.
- Electron 1.3.1 (Node 6.3.0, Chromium 52), Cytoscape.js 2.7.1
  - Ghosting. Regression occured between 2.6.12 and 2.7.0.
  - When graph is first dragged, there is a good chance of it leaving behind a ghosted image in its previous position.
  Once this has occured, further ghosting does not occur until an element on the graph is adjusted.
  When an element is selected, graph layout will slow significantly for a few seconds with <10 FPS (estimated) performance.
  After about 2 seconds, graph returns to full speed, sometimes leaving another ghosted image behind.
  - Possible causes?
    - #1293 Rendering of haystack edges during drag
    - #593 Cache element textures/ bitmaps
      - The fact that this only occurs after adjustments to the graph have been made makes me think a caching issue.
