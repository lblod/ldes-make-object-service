# LDES Make Object Service

Make an object from an ldes feed. It requires an ldes consumer and te delta notifier.

## Introduction

The `ldes-consumer` consumes versions from an LDES feed. In order to make an object from
the version, we must extract the proper subject from the `dct:isVersionOf`.

This service is set to listen to delta messages, detects new inserts with a `dct:isVersionOf`
predicate, and update a `target graph` accordingly.

In order to achieve this, the ldes consumer service must write ldes version to a `landing zone graph`.

Here's an example:

```yml
  consumer:
    image: redpencil/ldes-consumer
    environment:
      CRON_PATTERN: "*/10 * * * * *"
      LDES_STREAM: https://dev-vlag.roadsigns.lblod.info/ldes-mow-register
      LDES_ENDPOINT_VIEW: https://dev-vlag.roadsigns.lblod.info/ldes-mow-register/1
      MU_SPARQL_ENDPOINT: "http://database:8890/sparql"
      MU_APPLICATION_GRAPH: "http://mu.semte.ch/graphs/ldes"
  make-object:
    image: lblod/ldes-make-object-service
    environment:
      LANDING_ZONE_GRAPH: "http://mu.semte.ch/graphs/ldes"
      TARGET_GRAPH: "http://mu.semte.ch/graphs/public"
```

Add the following rule to the delta-notifier configuration in `./config/delta/rules.js`

```javascript
export default [
  // ... other rules
  {
    match: {
      predicate: { type: 'uri', value: 'http://purl.org/dc/terms/isVersionOf' }
    },
    callback: {
      url: "http://make-object/delta",
      method: "POST"
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 500,
      ignoreFromSelf: true
    }
  }
];
```

## Reference
### Configuration
The following environment variables can be configured on the service:
- **LANDING_ZONE_GRAPH**: URI of the graph to which data of the LDES feed is written (default: `http://mu.semte.ch/graphs/ldes`)
- **TARGET_GRAPH**: URI of the graph to which the consolidated objects must be written (default: `http://mu.semte.ch/graphs/public`)
- **DEEP_COPY_BLANK_NODES**: If enabled nested blank nodes up to 3 levels deep will be copied to the target graph as well (default: `false`)
- **BLANK_NODE_NAMESPACE**: Base URI of blank nodes in the LDES feed (default: `http://mu.semte.ch/blank#`)
