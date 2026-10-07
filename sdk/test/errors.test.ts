import { describe, expect, it } from 'vitest';

import { Error as GeneratedError } from '../src/generated/types.js';
import {
  CONTRACT_ERROR_MESSAGES,
  contractErrorName,
  contractErrorMessage,
  describeContractErrorCode,
  describeUnknownError,
} from '../src/errors.js';

describe('contract error messages', () => {
  it('has a non-empty message for every error code the generated spec publishes', () => {
    const codes = Object.keys(GeneratedError).map(Number);
    expect(codes.length).toBeGreaterThan(0);

    for (const code of codes) {
      const message = CONTRACT_ERROR_MESSAGES[code];
      expect(message, `code ${code} is missing a message`).toBeTypeOf('string');
      expect(message?.length, `code ${code} has an empty message`).toBeGreaterThan(0);
    }
  });

  it('does not define messages the contract never publishes', () => {
    const published = new Set(Object.keys(GeneratedError).map(Number));
    for (const code of Object.keys(CONTRACT_ERROR_MESSAGES).map(Number)) {
      expect(published.has(code), `code ${code} is not in the generated spec`).toBe(true);
    }
  });

  it('keeps the enum name aligned with the generated spec', () => {
    for (const [rawCode, entry] of Object.entries(GeneratedError)) {
      const code = Number(rawCode);
      expect(contractErrorName(code)).toBe(entry.message);
    }
  });

  it('covers every variant, and the fallback is only for unknown codes', () => {
    for (const code of Object.keys(GeneratedError).map(Number)) {
      const message = contractErrorMessage(code);
      expect(message).not.toContain('unknown error code');
    }
    expect(contractErrorMessage(9999)).toContain('unknown error code');
  });

  it('describes a code with its name and message', () => {
    expect(describeContractErrorCode(10)).toContain('SeniorGateViolated');
    expect(describeContractErrorCode(10)).toContain(CONTRACT_ERROR_MESSAGES[10] ?? '');
  });
});

describe('describeUnknownError', () => {
  it('unwraps an Error', () => {
    expect(describeUnknownError(new TypeError('boom'))).toBe('TypeError: boom');
  });

  it('passes a string through', () => {
    expect(describeUnknownError('plain')).toBe('plain');
  });

  it('never throws on odd values', () => {
    expect(describeUnknownError(undefined)).toBeTypeOf('string');
    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    expect(describeUnknownError(cyclic)).toBeTypeOf('string');
  });
});
