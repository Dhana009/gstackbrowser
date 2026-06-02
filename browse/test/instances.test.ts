import { describe, test, expect } from 'bun:test';
import {
  validateInstanceName,
  resolveInstancePaths,
  instancesRoot,
  listInstanceNames,
} from '../src/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('instances', () => {
  describe('validateInstanceName', () => {
    test('accepts alphanumeric, dash, underscore', () => {
      expect(() => validateInstanceName('interview1')).not.toThrow();
      expect(() => validateInstanceName('lead-magnet_2')).not.toThrow();
      expect(() => validateInstanceName('A')).not.toThrow();
    });

    test('rejects empty', () => {
      expect(() => validateInstanceName('')).toThrow();
    });

    test('rejects path separators and traversal', () => {
      expect(() => validateInstanceName('..')).toThrow();
      expect(() => validateInstanceName('a/b')).toThrow();
      expect(() => validateInstanceName('../escape')).toThrow();
      expect(() => validateInstanceName('a.b')).toThrow();
      expect(() => validateInstanceName('a b')).toThrow();
    });
  });

  describe('instancesRoot', () => {
    test('lives under GSTACK_HOME', () => {
      const env = { GSTACK_HOME: '/tmp/gh-test' };
      expect(instancesRoot(env)).toBe('/tmp/gh-test/instances');
    });

    test('defaults to ~/.gstack/instances', () => {
      expect(instancesRoot({})).toBe(path.join(os.homedir(), '.gstack', 'instances'));
    });
  });

  describe('resolveInstancePaths', () => {
    test('derives state file and profile dir from name', () => {
      const env = { GSTACK_HOME: '/tmp/gh-test' };
      const p = resolveInstancePaths('interview1', env);
      expect(p.stateFile).toBe('/tmp/gh-test/instances/interview1/browse.json');
      expect(p.profileDir).toBe('/tmp/gh-test/instances/interview1/chromium-profile');
    });

    test('validates the name', () => {
      expect(() => resolveInstancePaths('../escape', {})).toThrow();
    });

    test('profile basename stays chromium-profile (singleton-lock safety)', () => {
      const p = resolveInstancePaths('x', { GSTACK_HOME: '/tmp/gh-test' });
      expect(path.basename(p.profileDir)).toBe('chromium-profile');
    });
  });

  describe('listInstanceNames', () => {
    test('returns dir names under instances root', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-inst-'));
      const env = { GSTACK_HOME: root };
      fs.mkdirSync(path.join(root, 'instances', 'alpha'), { recursive: true });
      fs.mkdirSync(path.join(root, 'instances', 'beta'), { recursive: true });
      const names = listInstanceNames(env).sort();
      expect(names).toEqual(['alpha', 'beta']);
      fs.rmSync(root, { recursive: true, force: true });
    });

    test('returns empty when root absent', () => {
      expect(listInstanceNames({ GSTACK_HOME: '/tmp/does-not-exist-xyz' })).toEqual([]);
    });
  });
});
