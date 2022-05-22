module.exports = {
    mode: 'production', // or "development" or "none"
    entry: './lab4/practice4.js',
    output: {
        filename: './bundle2.js',
    },
    experiments: {
        topLevelAwait: true,
      },
}