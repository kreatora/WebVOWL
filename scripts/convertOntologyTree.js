#!/usr/bin/env node
/*
 * Convert a simple tree JSON (name, children) into VOWL-JSON suitable for WebVOWL.
 * Input: src/app/data/ontology_tree.json
 * Output: src/app/data/ontology_tree_vowl.json
 */

const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.join(__dirname, "../src/app/data/ontology_tree.json");
const OUTPUT_PATH = path.join(__dirname, "../src/app/data/ontology_tree_vowl.json");

function readTree(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function buildVowlFromTree(tree) {
  let nextId = 1;
  const idByName = new Map();
  const classes = [];
  const classAttributes = [];
  const properties = [];
  const propertyAttributes = [];
  const baseIri = "http://example.org/ontology";

  function getId(name) {
    if (!idByName.has(name)) {
      const idStr = String(nextId++);
      idByName.set(name, idStr);
      classes.push({ id: idStr, type: "owl:Class" });
      const iri = `${baseIri}#${encodeURIComponent(name.replace(/\s+/g, "_"))}`;
      classAttributes.push({
        id: idStr,
        iri,
        baseIri,
        label: { en: name, undefined: name }
      });
    }
    return idByName.get(name);
  }

  function walk(node, parentName = null) {
    const nodeName = node.name || String(node);
    const nodeId = getId(nodeName);

    if (parentName) {
      const parentId = getId(parentName);
      // Annotate superClasses on the child
      const attr = classAttributes.find(a => a.id === nodeId);
      if (attr) {
        if (!attr.superClasses) attr.superClasses = [];
        attr.superClasses.push(parentId);
      }
      // Also add explicit rdfs:SubClassOf edge for reliable rendering
      const propId = String(properties.length + 1 + 1000); // avoid collisions with typical datasets
      properties.push({ id: propId, type: "rdfs:SubClassOf" });
      propertyAttributes.push({ id: propId, domain: nodeId, range: parentId });
    }

    const children = Array.isArray(node.children) ? node.children : [];
    for (const child of children) {
      walk(child, nodeName);
    }
  }

  walk(tree, null);

  const vowl = {
    namespace: [ { name: "ex", iri: baseIri } ],
    header: {
      languages: ["en"],
      title: { en: "Ontology Tree" },
      iri: baseIri,
      version: "1.0",
      author: ["Generated"],
      description: { en: "Auto-converted ontology tree to VOWL-JSON" }
    },
    class: classes,
    classAttribute: classAttributes,
    property: properties,
    propertyAttribute: propertyAttributes
  };

  return vowl;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Input not found: ${INPUT_PATH}`);
    process.exit(1);
  }
  const tree = readTree(INPUT_PATH);
  const vowl = buildVowlFromTree(tree);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(vowl, null, 2), "utf8");
  console.log(`Wrote VOWL JSON: ${OUTPUT_PATH}`);
}

if (require.main === module) {
  main();
}