import { app, errorHandler } from "mu";
import { updateSudo } from "@lblod/mu-auth-sudo";
import { Delta } from "./lib/delta";
import bodyParser from "body-parser";

const LANDING_ZONE_GRAPH =
  process.env.LANDING_ZONE_GRAPH || "http://mu.semte.ch/graphs/ldes";
const TARGET_GRAPH =
  process.env.TARGET_GRAPH || "http://mu.semte.ch/graphs/public";
const DEEP_COPY_BLANK_NODES = process.env.DEEP_COPY_BLANK_NODES;
const BLANK_NODE_NAMESPACE =
  process.env.BLANK_NODE_NAMESPACE || 'http://mu.semte.ch/blank#';

app.use(
  bodyParser.json({
    type: function (req) {
      return /^application\/json/.test(req.get("content-type"));
    },
  }),
);

app.get("/", function (_, res) {
  res.send("Hello world!");
});

app.post("/delta", async function (req, res, next) {
  try {
    const entries = new Delta(req.body).getInsertsFor(
      "http://purl.org/dc/terms/isVersionOf",
    );
    if (!entries.length) {
      console.debug("Delta dit not contain any interesting subjects.");
      return res.status(204).send();
    }

    await Promise.all(entries.map(async (e) => await makeObject(e)));

    return res.status(200).send().end();
  } catch (e) {
    console.log(`Something unexpected went wrong while handling delta!`);
    console.error(e);
    return next(e);
  }
});

async function makeObject(subject) {
  const query = `
    DELETE {
      GRAPH <${TARGET_GRAPH}> {
         ?x ?y ?z .
         ?z ?y1 ?z1 .
         ?z1 ?y2 ?z2 .
         ?z2 ?y3 ?z3 .
      }
    }
    INSERT {
      GRAPH <${TARGET_GRAPH}> {
         ?x ?p ?o .
         ?o ?p1 ?o1 .
         ?o1 ?p2 ?o2 .
         ?o2 ?p3 ?o3 .
      }
    }
    WHERE {
      GRAPH <${LANDING_ZONE_GRAPH}> {
        <${subject}> <http://purl.org/dc/terms/isVersionOf> ?x .
      }
      {
        GRAPH <${LANDING_ZONE_GRAPH}> {
          ${!DEEP_COPY_BLANK_NODES
            ? '<${subject}> ?p ?o . FILTER (?p != <http://purl.org/dc/terms/isVersionOf>)'
            : `{
                 <${subject}> ?p ?o .
                 FILTER (?p != <http://purl.org/dc/terms/isVersionOf>)
               } UNION {
                 <${subject}> ?p ?o .
                 FILTER (?p != <http://purl.org/dc/terms/isVersionOf>)
                 FILTER (STRSTARTS(STR(?o), "${BLANK_NODE_NAMESPACE}")) .

                 {
                   ?o ?p1 ?o1 .
                 } UNION {
                   ?o ?p1 ?o1 .
                   FILTER (STRSTARTS(STR(?o1), "${BLANK_NODE_NAMESPACE}")) .

                   {
                     ?o1 ?p2 ?o2 .
                   } UNION {
                     ?o1 ?p2 ?o2 .
                     FILTER (STRSTARTS(STR(?o2), "${BLANK_NODE_NAMESPACE}")) .
                     ?o2 ?p3 ?o3 .
                   }
                 }
               }`
          }
        }
      } UNION {
        GRAPH <${TARGET_GRAPH}> {
          ${!DEEP_COPY_BLANK_NODES
            ? '?x ?y ?z'
            : `{
                 ?x ?y ?z .
               } UNION {
                 ?x ?y ?z .
                 FILTER (STRSTARTS(STR(?z), "${BLANK_NODE_NAMESPACE}")) .

                 {
                   ?z ?y1 ?z1 .
                 } UNION {
                   ?z ?y1 ?z1 .
                   FILTER (STRSTARTS(STR(?z1), "${BLANK_NODE_NAMESPACE}")) .

                   {
                     ?z1 ?y2 ?z2 .
                   } UNION {
                     ?z1 ?y2 ?z2 .
                     FILTER (STRSTARTS(STR(?z2), "${BLANK_NODE_NAMESPACE}")) .
                     ?z2 ?y3 ?z3 .
                   }
                 }
               }`
          }
        }
      }
    }
`;
  await updateSudo(query);
}

app.use(errorHandler);
