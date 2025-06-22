const { defineConfig } = require("@vue/cli-service");
const webpack = require("webpack");
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
//   .BundleAnalyzerPlugin;

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: "/sandbox/",
  chainWebpack: (config) => {
    config.resolve.symlinks(false);
    config.optimization.minimize(true);
    config.optimization.usedExports(true);
    // config.plugin("bundle-analyzer").use(BundleAnalyzerPlugin);
  },
  configureWebpack: {
    resolve: {
      fallback: {
        "path": require.resolve("path-browserify"),
        "fs": false,
        "crypto": false
      },
    },
    plugins: [
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
      })
    ]
  },
  css: {
    loaderOptions: {
      sass: {
        implementation: require('sass'),
        sassOptions: {
          api: 'modern-compiler'
        }
      }
    }
  }
});
