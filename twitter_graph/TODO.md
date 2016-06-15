- DONE. Add Qtip extension
- Get followers of followers to make force-directred more interesting (will there be cliques?)
- Use Express API instead of already downloaded files (will this be too slow?)
  - Don't do until done with other steps; otherwise, API calls will be rate-limited as I test
  - Could load using JQuery now that I am using it for Qtip
    - And use a Promise (see Wine and Cheese demo) to wait to add followers until main user loaded
- Performance?
  - Rewrite using the JQuery method of waiting on DOM instead of DOMContentLoaded event


NOTES
- Or look at using Heroku for using API with JS. But start with static data and write program for downloading data later.
  - "Centrality" measurement for the graph. Or degree. Mapper for size of node based on degree. Degree is a cy function. Try color or border to correlate with number of tweets.
- Feature set: emphasize layout. At least two layout options for user to choose:
  - Concentric (circle) AND physics simulation (force directed like cose or cola)
  - Look at Qtip extension for putting in additional statistics about nodes/ edges. Ex: link to their twitter profile.