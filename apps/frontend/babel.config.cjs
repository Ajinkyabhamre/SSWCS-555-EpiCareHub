module.exports = function (api) {
    api.cache(true);
  
    const presets = [
        ["@babel/preset-react", { "runtime": "automatic" }],
        ["@babel/preset-env", { "modules": "commonjs", targets: { node: 'current' } }]
        // Add other presets as needed
      ];
    const plugins = [
      // Add other plugins as needed
    ];
  
    return {
      sourceType: 'unambiguous', // Add this line
      presets,
      plugins
    };
  };
  