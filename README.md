# feedaffinity

proxy service for subscribing to [furaffinity](https://furaffinity.net) galleries and journals via RSS.

## why?

because FA sucks. the site was created in 2005 when the internet was a different place. it's 2017 now and nobody cares anymore, and many artists post their art on twitter and/or tumblr.

[as per lowtax:](https://twitter.com/lowtax/status/644935440613543936)

> I'd like to personally apologize to any furries I may have insulted over the past 15 years. You guys are normal compared to the new internet

I don't like the fact that I need to register for and use an entire website just to keep up with some of my favorite artists. I would love if I could do so in my feed reader.

## goals

### stateless api

the api should be stateless. no user information will be stored. instead of taking the user's password, the app should take a session token from the site and use that to authenticate. this will be serialized into the GET request and only ever stored in memory. (yes when I eventually run a public instance, it will support HTTPS).

### opml subscription

the app should also expose routes which generate opml files based on the user's watches, for user journals and galleries (and scraps? maybe).

this should work well with [Inoreader](https://inoreader.com), my preferred feed reader.

### serverless (?)

I am unsure about this but I might develop this for the [serverless framework](https://serverless.com/) to avoid screwing with server management, and to allow others to easily launch their own instances.
