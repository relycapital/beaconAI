module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add any necessary plugins here
      '@babel/plugin-transform-react-jsx'
    ],
  };
};