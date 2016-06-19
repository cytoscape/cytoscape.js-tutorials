- DONE. Add Qtip extension
- DONE. Get followers of followers to make force-directred more interesting (will there be cliques?)
- DONE. Use Express API instead of already downloaded files (will this be too slow?)
  - Don't do until done with other steps; otherwise, API calls will be rate-limited as I test
    - FIXED: Express API will cache Twitter data
  - DONE. Could load using JQuery now that I am using it for Qtip
- Performance?
  - NOT FIXING. Rewrite using the JQuery method of waiting on DOM instead of DOMContentLoaded event
- Style
  - Add a loading spinner to screen, similar to Wine and Cheese demo?


NOTES
- Or look at using Heroku for using API with JS. But start with static data and write program for downloading data later.
  - "Centrality" measurement for the graph. Or degree. Mapper for size of node based on degree. Degree is a cy function. Try color or border to correlate with number of tweets.
- Feature set: emphasize layout. At least two layout options for user to choose:
  - Concentric (circle) AND physics simulation (force directed like cose or cola)
  - Look at Qtip extension for putting in additional statistics about nodes/ edges. Ex: link to their twitter profile.