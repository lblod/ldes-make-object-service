import { app, errorHandler } from "mu";
import { updateSudo } from "@lblod/mu-auth-sudo";
import { Delta } from "./lib/delta";
import bodyParser from "body-parser";

const LANDING_ZONE_GRAPH =
  process.env.LANDING_ZONE_GRAPH || "http://mu.semte.ch/graphs/ldes";
const TARGET_GRAPH =
  process.env.TARGET_GRAPH || "http://mu.semte.ch/graphs/public";

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
    delete {
	    graph <${TARGET_GRAPH}> {
	       ?x ?y ?z.
	    }
    }
    insert {
	    graph <${TARGET_GRAPH}> {
	       ?x ?p ?o
	    }
    }
    where {
	    graph <${LANDING_ZONE_GRAPH}> {
	      <${subject}> <http://purl.org/dc/terms/isVersionOf> ?x; ?p ?o.
	      filter (?p != <http://purl.org/dc/terms/isVersionOf>)
	      optional {graph <${TARGET_GRAPH}> {?x ?y ?z.} }
	    }
    }
`;
  await updateSudo(query);
}

app.use(errorHandler);
