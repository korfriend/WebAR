module.exports = {
    mode: 'production', // or "development" or "none"
    entry: './sample2.js',
    output: {
        filename: './bundle.js',
    },
    experiments: {
        topLevelAwait: true,
      },
}