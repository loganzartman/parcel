// @flow strict-local

import {execSync} from 'child_process';
import assert from 'assert';
import path from 'path';

describe('@parcel/register', () => {
  it('can be required at an entry script and transform following requires', () => {
    assert.equal(
      execSync(
        `node ${path.join(
          __dirname,
          'integration',
          'parcel-register',
          'entry.js',
        )}`,
        {timeout: 30000},
      )
        .toString()
        .trim(),
      '123',
    );
  });

  // Skip this test because when using -r, there's no way to call dispose()
  // and the process will hang waiting for Parcel's workers to terminate
  it.skip('can transform with --r and --require', () => {
    assert.equal(
      execSync(
        `node -r @parcel/register ${path.join(
          __dirname,
          'integration',
          'parcel-register',
          'index.js',
        )}`,
        {timeout: 30000},
      )
        .toString()
        .trim(),
      '123',
    );
  });

  // Skip resolver tests - resolver hook is currently disabled
  it.skip("enables Parcel's resolver in node", () => {
    let [foo, resolved] = execSync(
      `node -r @parcel/register ${path.join(
        __dirname,
        'integration',
        'parcel-register',
        'resolver.js',
      )}`,
      {cwd: path.join(__dirname, 'integration', 'parcel-register')},
    )
      .toString()
      .split('\n');
    assert.equal(foo, 'foo');
    assert.equal(
      resolved,
      path.join(__dirname, 'integration', 'parcel-register', 'foo.js'),
    );
  });

  // Skip resolver tests - resolver hook is currently disabled
  it.skip('can be disposed of, which reverts resolving', () => {
    try {
      execSync(
        `node ${path.join(
          __dirname,
          'integration',
          'parcel-register',
          'dispose-resolve.js',
        )}`,
        {
          cwd: path.join(__dirname, 'integration', 'parcel-register'),
          stdio: 'pipe',
        },
      )
        .toString()
        .split('\n');
    } catch (e) {
      assert.equal(
        e.stdout.toString().trim(),
        path.join(__dirname, 'integration', 'parcel-register', 'foo.js'),
      );
      assert(e.stderr.includes("Error: Cannot find module '~foo.js'"));
      return;
    }

    // $FlowFixMe
    assert.fail();
  });

  it('can be disposed of, which reverts transforming', () => {
    try {
      execSync(
        `node ${path.join(
          __dirname,
          'integration',
          'parcel-register',
          'dispose-transform.js',
        )}`,
        {
          cwd: path.join(__dirname, 'integration', 'parcel-register'),
          stdio: 'pipe',
          timeout: 30000,
        },
      )
        .toString()
        .split('\n');
    } catch (e) {
      assert.equal(e.stdout.toString().trim(), '123');
      // The error message varies between Node versions
      assert(
        e.stderr.includes('SyntaxError: Unexpected identifier') ||
          e.stderr.includes("SyntaxError: Unexpected token '{'"),
      );
      return;
    }

    // $FlowFixMe
    assert.fail();
  });
});
