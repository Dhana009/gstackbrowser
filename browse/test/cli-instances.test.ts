import { describe, test, expect } from 'bun:test';
import { parseInstanceName, applyInstanceEnv, extractGlobalFlags } from '../src/cli';

describe('cli instance selection', () => {
  describe('parseInstanceName', () => {
    test('--instance <name>', () => {
      expect(parseInstanceName(['--instance', 'foo', 'open', 'x'])).toBe('foo');
    });
    test('--instance=<name>', () => {
      expect(parseInstanceName(['--instance=bar', 'open'])).toBe('bar');
    });
    test('absent', () => {
      expect(parseInstanceName(['open', 'x'])).toBeNull();
    });
  });

  describe('applyInstanceEnv', () => {
    test('flag sets BROWSE_STATE_FILE + CHROMIUM_PROFILE', () => {
      const env: Record<string, string | undefined> = { GSTACK_HOME: '/tmp/gh' };
      const name = applyInstanceEnv(['--instance', 'iv1', 'open'], env);
      expect(name).toBe('iv1');
      expect(env.BROWSE_STATE_FILE).toBe('/tmp/gh/instances/iv1/browse.json');
      expect(env.CHROMIUM_PROFILE).toBe('/tmp/gh/instances/iv1/chromium-profile');
    });

    test('falls back to GSTACK_INSTANCE env', () => {
      const env: Record<string, string | undefined> = { GSTACK_HOME: '/tmp/gh', GSTACK_INSTANCE: 'iv2' };
      const name = applyInstanceEnv(['open'], env);
      expect(name).toBe('iv2');
      expect(env.BROWSE_STATE_FILE).toBe('/tmp/gh/instances/iv2/browse.json');
    });

    test('flag wins over env', () => {
      const env: Record<string, string | undefined> = { GSTACK_HOME: '/tmp/gh', GSTACK_INSTANCE: 'envone' };
      const name = applyInstanceEnv(['--instance', 'flagone'], env);
      expect(name).toBe('flagone');
      expect(env.BROWSE_STATE_FILE).toContain('/instances/flagone/');
    });

    test('no-op when BROWSE_STATE_FILE already set', () => {
      const env: Record<string, string | undefined> = { BROWSE_STATE_FILE: '/pre/set/browse.json' };
      const name = applyInstanceEnv(['--instance', 'iv1'], env);
      expect(name).toBeNull();
      expect(env.BROWSE_STATE_FILE).toBe('/pre/set/browse.json');
      expect(env.CHROMIUM_PROFILE).toBeUndefined();
    });

    test('no-op when nothing named', () => {
      const env: Record<string, string | undefined> = { GSTACK_HOME: '/tmp/gh' };
      expect(applyInstanceEnv(['open'], env)).toBeNull();
      expect(env.BROWSE_STATE_FILE).toBeUndefined();
    });

    test('throws on invalid name', () => {
      const env: Record<string, string | undefined> = {};
      expect(() => applyInstanceEnv(['--instance', '../escape'], env)).toThrow();
    });
  });

  describe('extractGlobalFlags strips --instance', () => {
    test('--instance <name> removed from args', () => {
      const f = extractGlobalFlags(['--instance', 'foo', 'open', 'http://x'], {});
      expect(f.args).toEqual(['open', 'http://x']);
    });
    test('--instance=<name> removed from args', () => {
      const f = extractGlobalFlags(['--instance=foo', 'click', '@e1'], {});
      expect(f.args).toEqual(['click', '@e1']);
    });
  });
});
