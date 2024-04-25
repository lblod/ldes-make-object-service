# LDES Make Object Service

Make an object from an ldes feed. It requires an ldes consumer and te delta notifier.

### Introduction

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
    links:
      - database:database
```
