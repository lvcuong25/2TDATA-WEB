export function listEndpoints(appOrRouter, prefix = "") {
  const stack = appOrRouter.stack || appOrRouter._router?.stack || [];
  for (const layer of stack) {
    if (layer.route) {
      const path = prefix + layer.route.path;
      const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
      console.log(methods.padEnd(10), path);
    } else if (layer.name === "router" && layer.handle?.stack) {
      const p = layer.regexp?.source
        .replace("^\\", "/")
        .replace("\\/?(?=\\/|$)", "")
        .replace(/\\\//g, "/")
        .replace(/(\^|\$)/g, "");
      listEndpoints(layer.handle, prefix + (p || ""));
    }
  }
}