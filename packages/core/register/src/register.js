// @flow strict-local

import type {IDisposable, InitialParcelOptions} from '@parcel/types';

// $FlowFixMe Flow can't resolve this
import Module from 'module';
import path from 'path';
import {addHook} from 'pirates';
import Parcel, {createWorkerFarm} from '@parcel/core';

// Force eager loading of syncPromise and its dependencies (deasync)
// before we patch Module._resolveFilename
// $FlowFixMe[untyped-import]
const syncPromise = require('./syncPromise').default;

let hooks = {};
let lastDisposable;
let parcelInstance;

function register(inputOpts?: InitialParcelOptions): IDisposable {
  let opts: InitialParcelOptions = {
    defaultConfig: '@parcel/config-default',
    ...(inputOpts || {}),
  };

  // Replace old hook, as this one likely contains options.
  if (lastDisposable) {
    lastDisposable.dispose();
  }

  let parcel = new Parcel({
    logLevel: 'error',
    ...opts,
  });
  parcelInstance = parcel;

  let env = {
    context: 'node',
    engines: {
      node: process.versions.node,
    },
  };

  let isProcessing = false;

  // As Parcel is pretty much fully asynchronous, create an async function and wrap it in a syncPromise later...
  async function fileProcessor(code, filePath) {
    if (isProcessing) {
      return code;
    }

    try {
      isProcessing = true;
      let assets = await parcel.unstable_transform({
        filePath,
        env,
      });

      if (assets && assets.length >= 1) {
        let output = '';
        let asset = assets.find(a => a.type === 'js');
        if (asset) {
          output = await asset.getCode();
        }
        return output;
      }
    } catch (e) {
      /* eslint-disable no-console */
      console.error('@parcel/register failed to process: ', filePath);
      console.error(e);
      /* eslint-enable */
    } finally {
      isProcessing = false;
    }

    return '';
  }

  let hookFunction = (...args) => syncPromise(fileProcessor(...args));

  // Skip parcel's own packages and node_modules to avoid recursion
  const matcher = (filename: string) => {
    // Skip node_modules
    if (filename.includes('/node_modules/')) {
      return false;
    }
    // Skip parcel compiled packages (lib directories in packages/)
    // This handles workspace links without skipping example/test files
    if (/\/packages\/[^/]+\/[^/]+\/lib\//.test(filename)) {
      return false;
    }
    return true;
  };

  function resolveFile(currFile, targetFile) {
    try {
      isProcessing = true;

      let result = syncPromise(
        parcel.unstable_resolve({
          specifier: targetFile,
          resolveFrom: currFile,
          env,
        }),
      );

      if (!result) {
        throw new Error(`Cannot resolve '${targetFile}' from '${currFile}'`);
      }

      let resolved = result.filePath;
      let targetFileExtension = path.extname(resolved);
      if (!hooks[targetFileExtension]) {
        hooks[targetFileExtension] = addHook(hookFunction, {
          exts: [targetFileExtension],
          ignoreNodeModules: true,
          matcher,
        });
      }

      return resolved;
    } finally {
      isProcessing = false;
    }
  }

  // Register hooks for common file types that need transformation
  const defaultExts = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  for (let ext of defaultExts) {
    hooks[ext] = addHook(hookFunction, {
      exts: [ext],
      ignoreNodeModules: true,
      matcher,
    });
  }

  let disposed;

  // TODO: Re-enable resolver hook - currently disabled for debugging
  // Patching Module._resolveFilename takes care of patching the underlying
  // resolver in both `require` and `require.resolve`:
  // https://github.com/nodejs/node-v0.x-archive/issues/1125#issuecomment-10748203
  // $FlowFixMe[prop-missing]
  // const originalResolveFilename = Module._resolveFilename;
  // // $FlowFixMe[prop-missing]
  // Module._resolveFilename = function parcelResolveFilename(to, from, ...rest) {
  //   return isProcessing || disposed
  //     ? originalResolveFilename(to, from, ...rest)
  //     : resolveFile(from?.filename, to);
  // };

  let disposable = (lastDisposable = {
    dispose() {
      if (disposed) {
        return;
      }

      for (let extension in hooks) {
        hooks[extension]();
      }

      // Clean up Parcel's worker farm to allow process to exit
      if (parcelInstance) {
        try {
          // $FlowFixMe[incompatible-use] - _end is a private method but we need it for cleanup
          syncPromise(parcelInstance._end());
        } catch (e) {
          // Ignore errors during cleanup
        }
        parcelInstance = null;
      }

      disposed = true;
    },
  });

  return disposable;
}

let disposable: IDisposable = register();
register.dispose = (): mixed => disposable.dispose();

// Auto-dispose on process exit to prevent hanging
process.on('beforeExit', () => {
  register.dispose();
});

// Support both commonjs and ES6 modules
module.exports = register;
exports.default = register;
exports.__esModule = true;
