- Figure out best location to store cached data.
  - Probably don't need to use temp package. Can just use os.tmpDir() and write there. 
    That way, files end up in a predictable location instead of randomized.
- Make Promises better
  - Almost done changing twitter_api.js to use no more try/ catch blocks and only uses Promises! 
    - Need to test more and replace getUser with getUser2 and write a similar method for getFollowers
- Replace environment variable with a API key input box. 