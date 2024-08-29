How to configure the project build, where the project dist is placed in a lightweight docker image, with nginx,
but the environment.prod.ts file in a separate bundle, and when the container is started,
all environment variable placeholders in that bundle are replaced with the actual environment values.

Tip: All {SOMETHING} placeholders must be replaced with your actual values

# Extend the angular build process with the custom webpack config

```
npm i ngx-build-plus --save-dev
```

**angular.js**

```text
projects > {APP} > architect > build > [builder: ngx-build-plus:browser]
projects > {APP} > architect > build > options > [extraWebpackConfig: ./webpack.config.js]
```

**webpack.config.js**

```js
const version = require('./package.json').version;

module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        // split the environment config into a separate bundle for later substitution
        config: {
          test: /[\\/]environment(\.prod)?\.ts$/,
          name: 'config',
          priority: 1,
          enforce: true
        }
      }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      APP_VERSION: JSON.stringify(version)
    })
  ]
};
```

# Set up CI/CD with the provided Docker file

Don't forget to replace {APP} in Docker file

# Set up environment variable placeholders

**environment.prod.ts**

```ts
export const environment = {
  production: true,

  // will be substituted by environment values
  config: {
    apiUrl: '//${ENV_API_VAR}'
  }
};
```
