## [2.0.9] - 2020-04-24

### Fix

- When specifying url options password is just ignored (@scorpp)

## [2.0.8] - 2020-04-12

### Improvement

- Updating dependencies
- Switching to circleci

## [2.0.7] - 2020-04-11

### Fix

Fix npm package

## [2.0.6] - 2020-02-08

### Improvement

Updating dependencies

## [2.0.5] - 2019-10-02

### Improvement

Parse url using url module rather than string manipulation

## [2.0.4] - 2019-09-19
  
### Improvement

Allow users to provide a url option rather than the host and port in the format: `host:port`. Useful
for some environments like convox that inject it automatically.

## [2.0.3] - 2019-08-07
  
### Fix

Allow multiple gets, although display a warning since it shouldn't happen normally

## [2.0.2] - 2019-07-31

### Fix

Depend on @deepstream/protobuf as a dev dependency since it includes types needed by typescript

## [2.0.1] - 2019-07-31

### Fix

Depend on @deepstream/types that doesn't have protobuf and ts-essentials as a production dependency

## [2.0.0] - 2019-07-30

### Feature

Using the new V4 API, allowing versions to be stored seperately from the data for faster withdrawal times.

## [1.2.2] - 2019-05-30

### Fix
- Correcting index file in package.json

## [1.2.1] - 2019-05-30

### Enhancements
- Adding error logging to capture a potential issue with write acks

## [1.2.0] - 2018-08-20

### Enhancements
- Using pipeline to speedup reads and writes (at a risk of too much GC that node 10 should fix!)

## [1.1.0] - 2017-07-20

### Enhancements
- Adding optional time-to-live to writes

## [1.0.4] - 2017-02-15

### Fixes
- Adding back node 4 compatibility

## [1.0.3] - 2017-02-12

### Enhancements
- Bumping ioredis to version 3
- Using travis/appveyor redis instead of self-hosted
- Building against node version 6.9

## [1.0.2] - 2016-09-22

### Enhancements
- When Deepstream quits, gracefully closes the connection to Redis

## [1.0.1] - 2016-09-13

### Miscellaneous
- CI build no longer depends on external Redis

## [1.0.0] 2016-06-29
