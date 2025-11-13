/**
 * Toggle module for enabling a simple tree layout.
 * It uses the filter hook only to propagate the option; no filtering.
 */
module.exports = function (graph) {
  var DEFAULT_STATE = false;

  var filter = {},
    nodes,
    properties,
    enabled = DEFAULT_STATE,
    filteredNodes,
    filteredProperties;

  // No filtering; just set the option on the graph
  filter.filter = function (untouchedNodes, untouchedProperties) {
    nodes = untouchedNodes;
    properties = untouchedProperties;
    graph.options().treeLayoutEnabled(enabled);
    filteredNodes = nodes;
    filteredProperties = properties;
  };

  filter.enabled = function (p) {
    if (!arguments.length) return enabled;
    enabled = p;
    graph.options().treeLayoutEnabled(enabled);
    return filter;
  };

  filter.reset = function () {
    enabled = DEFAULT_STATE;
    graph.options().treeLayoutEnabled(enabled);
  };

  // Functions a filter must have
  filter.filteredNodes = function () {
    return filteredNodes;
  };

  filter.filteredProperties = function () {
    return filteredProperties;
  };

  return filter;
};