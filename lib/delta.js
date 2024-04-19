import flatten from "lodash.flatten";

export class Delta {
  constructor(delta) {
    this.delta = delta;
  }

  get inserts() {
    return flatten(this.delta.map((changeSet) => changeSet.inserts));
  }

  getInsertsFor(predicate) {
    const inserts = this.inserts
      .filter((t) => t.predicate.value === predicate)
      .map((t) => t.subject.value);
    return [...new Set(inserts)];
  }
}
