import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  caesarCipher,
  playfairCipher,
  railFenceCipher,
  columnarTranspositionCipher,
  algorithmRegistry,
  getCipher,
  encrypt as universalEncrypt,
  decrypt as universalDecrypt,
} from '../src/algorithms/index.js';

describe('Classical Cryptography Algorithm Modules', () => {

  // ==========================================
  // 1. CAESAR CIPHER
  // ==========================================
  describe('Caesar Cipher (caesarCipher.js)', () => {
    it('encrypts known classical examples', () => {
      // Shift 3 (Traditional Caesar shift)
      assert.equal(caesarCipher.encrypt('HELLO WORLD', 3), 'KHOOR ZRUOG');
      assert.equal(caesarCipher.encrypt('attack at dawn', 5), 'fyyfhp fy ifbs');
      assert.equal(caesarCipher.encrypt('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG', 23), 'QEB NRFZH YOLTK CLU GRJMP LSBO QEB IXWV ALD');
    });

    it('decrypts known classical examples', () => {
      assert.equal(caesarCipher.decrypt('KHOOR ZRUOG', 3), 'HELLO WORLD');
      assert.equal(caesarCipher.decrypt('fyyfhp fy ifbs', 5), 'attack at dawn');
      assert.equal(caesarCipher.decrypt('QEB NRFZH YOLTK CLU GRJMP LSBO QEB IXWV ALD', 23), 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG');
    });

    it('handles identity shifts (key = 0 and key = 26 mod 26)', () => {
      const sample = 'Security & Cryptography 2026!';
      assert.equal(caesarCipher.encrypt(sample, 0), sample);
      assert.equal(caesarCipher.decrypt(sample, 0), sample);
    });

    it('handles boundary shift key 25', () => {
      assert.equal(caesarCipher.encrypt('ABC xyz', 25), 'ZAB wxy');
      assert.equal(caesarCipher.decrypt('ZAB wxy', 25), 'ABC xyz');
    });

    it('preserves case, spaces, digits, punctuation, and symbols', () => {
      const input = 'CipherMail v1.1: Meet me at 221B Baker St. #TopSecret!';
      const encrypted = caesarCipher.encrypt(input, 7);
      const decrypted = caesarCipher.decrypt(encrypted, 7);

      assert.notEqual(encrypted, input);
      assert.equal(decrypted, input);
      // Non-letters must be preserved exactly in position, digits and symbols preserved
      assert.ok(encrypted.includes('1.1'));
      assert.ok(encrypted.includes('221'));
      assert.ok(encrypted.includes('#'));
      assert.ok(encrypted.includes('!'));
    });

    it('handles empty string gracefully', () => {
      assert.equal(caesarCipher.encrypt('', 13), '');
      assert.equal(caesarCipher.decrypt('', 13), '');
    });

    it('guarantees exact round-trip for arbitrary text', () => {
      const testCases = [
        'Confidential dispatch between Alice and Bob.',
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        'Special chars: ~!@#$%^&*()_+`-={}|[]\\:";\'<>?,./',
        'Multi-line\nmessage\twith tabs',
      ];

      for (const text of testCases) {
        for (const k of [1, 3, 7, 13, 20, 25]) {
          assert.equal(caesarCipher.decrypt(caesarCipher.encrypt(text, k), k), text);
        }
      }
    });

    it('throws validation error for invalid keys', () => {
      assert.throws(() => caesarCipher.encrypt('test', -1), RangeError);
      assert.throws(() => caesarCipher.encrypt('test', 26), RangeError);
      assert.throws(() => caesarCipher.encrypt('test', 100), RangeError);
      assert.throws(() => caesarCipher.encrypt('test', 3.14), TypeError);
      assert.throws(() => caesarCipher.encrypt('test', 'abc'), TypeError);
      assert.throws(() => caesarCipher.encrypt('test', null), TypeError);
      assert.throws(() => caesarCipher.encrypt('test', undefined), TypeError);
    });

    it('throws validation error for invalid text input', () => {
      assert.throws(() => caesarCipher.encrypt(12345, 3), TypeError);
      assert.throws(() => caesarCipher.encrypt(null, 3), TypeError);
      assert.throws(() => caesarCipher.decrypt(undefined, 3), TypeError);
    });
  });

  // ==========================================
  // 2. PLAYFAIR CIPHER
  // ==========================================
  describe('Playfair Cipher (playfairCipher.js)', () => {
    it('constructs correct 5x5 matrix with I/J combined and no duplicate letters', () => {
      const keyMatrix = playfairCipher.validateKey('MONARCHY');
      assert.equal(keyMatrix.length, 25);
      // M O N A R C H Y + remaining letters excluding J
      assert.ok(keyMatrix.startsWith('MONARCHY'));
      assert.equal(keyMatrix.includes('J'), false);
      assert.equal(keyMatrix.includes('I'), true);
      assert.equal(new Set(keyMatrix).size, 25);
    });

    it('normalizes keyword with lowercase, punctuation, and J to I', () => {
      const matrix1 = playfairCipher.validateKey('playfair example');
      const matrix2 = playfairCipher.validateKey('PLAYFAIR EXAMPLE!');
      assert.equal(matrix1, matrix2);
      assert.equal(matrix1.includes('J'), false);
    });

    it('prepares digraphs correctly handling duplicate letters and odd length', () => {
      // Balloon -> BA LX LO ON (L split by filler X)
      assert.equal(playfairCipher.prepareText('BALLOON'), 'BALXLOON');

      // Hello -> HE LX LO (odd length gets pad X)
      assert.equal(playfairCipher.prepareText('HELLO'), 'HELXLO');

      // Repeated X -> filler Q, and remaining X at end padded with Z
      assert.equal(playfairCipher.prepareText('XX'), 'XQXZ');

      // Odd length ending in X -> pad with Z
      assert.equal(playfairCipher.prepareText('FOX'), 'FOXZ');
    });

    it('encrypts known Playfair examples correctly', () => {
      // Key: "MONARCHY"
      // Plaintext: "INSTRUMENTS" -> prepared: "IN ST RU ME NT SX"
      const encrypted = playfairCipher.encrypt('INSTRUMENTS', 'MONARCHY');
      assert.equal(encrypted.length, 12);
      assert.equal(encrypted, 'GATLMZCLRQXA');
    });

    it('decrypts known Playfair ciphertext to exact prepared digraphs', () => {
      const decrypted = playfairCipher.decrypt('GATLMZCLRQXA', 'MONARCHY');
      assert.equal(decrypted, 'INSTRUMENTSX'); // 'SX' is the padded final digraph
    });

    it('documents and verifies digraph round-trip property without false claims of raw restoration', () => {
      // Strategy: decrypt(encrypt(text, key), key) MUST equal prepareText(text)
      const samples = [
        'SECRET INTERNAL MEMO',
        'ATTACK AT DAWN TODAY',
        'COMMUNICATION DISPATCH',
        'HELLO ALICE THIS IS BOB',
      ];

      for (const sample of samples) {
        const prepared = playfairCipher.prepareText(sample);
        const ciphertext = playfairCipher.encrypt(sample, 'KEYWORD');
        const decrypted = playfairCipher.decrypt(ciphertext, 'KEYWORD');

        // Verified: Decrypted ciphertext exactly matches prepared digraphs
        assert.equal(decrypted, prepared);
      }
    });

    it('handles empty input cleanly', () => {
      assert.equal(playfairCipher.encrypt('', 'KEYWORD'), '');
      assert.equal(playfairCipher.decrypt('', 'KEYWORD'), '');
      assert.equal(playfairCipher.prepareText(''), '');
    });

    it('throws validation error for invalid keys and ciphertexts', () => {
      assert.throws(() => playfairCipher.encrypt('HELLO', ''), Error);
      assert.throws(() => playfairCipher.encrypt('HELLO', '12345'), Error);
      assert.throws(() => playfairCipher.encrypt('HELLO', null), TypeError);
      // Decryption requires even-length ciphertext
      assert.throws(() => playfairCipher.decrypt('ODD', 'KEYWORD'), Error);
    });
  });

  // ==========================================
  // 3. RAIL FENCE CIPHER
  // ==========================================
  describe('Rail Fence Cipher (railFenceCipher.js)', () => {
    it('encrypts known zigzag examples', () => {
      // Example 1: "HELLO WORLD", 2 rails (spaces preserved)
      assert.equal(railFenceCipher.encrypt('HELLO WORLD', 2), 'HLOWRDEL OL');

      // Example 2: "DEFEND THE EAST WALL OF THE CASTLE", 3 rails (spaces preserved)
      assert.equal(
        railFenceCipher.encrypt('DEFEND THE EAST WALL OF THE CASTLE', 3),
        'DNHAW TCLEEDTEES ALO H ATEF  TLFES'
      );

      // Example 3: "DEFENDTHEEASTWALLOFTHECASTLE", 3 rails (compact)
      assert.equal(
        railFenceCipher.encrypt('DEFENDTHEEASTWALLOFTHECASTLE', 3),
        'DNETLHSEEDHESWLOTEATEFTAAFCL'
      );
    });

    it('decrypts known zigzag examples exactly', () => {
      assert.equal(railFenceCipher.decrypt('HLOWRDEL OL', 2), 'HELLO WORLD');
      assert.equal(
        railFenceCipher.decrypt('DNHAW TCLEEDTEES ALO H ATEF  TLFES', 3),
        'DEFEND THE EAST WALL OF THE CASTLE'
      );
      assert.equal(
        railFenceCipher.decrypt('DNETLHSEEDHESWLOTEATEFTAAFCL', 3),
        'DEFENDTHEEASTWALLOFTHECASTLE'
      );
    });

    it('preserves all characters: uppercase, lowercase, punctuation, numbers, and spaces', () => {
      const complexText = 'CipherMail (v1.1) -> Alice & Bob: Meet at 10:30 PM @ Station #4!';
      const encrypted = railFenceCipher.encrypt(complexText, 4);
      const decrypted = railFenceCipher.decrypt(encrypted, 4);

      assert.notEqual(encrypted, complexText);
      assert.equal(decrypted, complexText);
    });

    it('handles edge cases: key >= text length, text length <= 1, empty text', () => {
      assert.equal(railFenceCipher.encrypt('', 3), '');
      assert.equal(railFenceCipher.decrypt('', 3), '');
      assert.equal(railFenceCipher.encrypt('A', 3), 'A');
      assert.equal(railFenceCipher.decrypt('A', 3), 'A');
      assert.equal(railFenceCipher.encrypt('SHORT', 10), 'SHORT');
      assert.equal(railFenceCipher.decrypt('SHORT', 10), 'SHORT');
    });

    it('guarantees exact round-trip across various rail depths', () => {
      const message = 'The quick brown fox jumps over the lazy dog! 1234567890.';
      for (const rails of [2, 3, 4, 5, 6, 7, 8, 12]) {
        const enc = railFenceCipher.encrypt(message, rails);
        const dec = railFenceCipher.decrypt(enc, rails);
        assert.equal(dec, message, `Failed round-trip at rails=${rails}`);
      }
    });

    it('throws validation error for invalid rail keys', () => {
      assert.throws(() => railFenceCipher.encrypt('TEST', 1), RangeError);
      assert.throws(() => railFenceCipher.encrypt('TEST', 0), RangeError);
      assert.throws(() => railFenceCipher.encrypt('TEST', -2), RangeError);
      assert.throws(() => railFenceCipher.encrypt('TEST', 2.5), TypeError);
      assert.throws(() => railFenceCipher.encrypt('TEST', 'invalid'), TypeError);
      assert.throws(() => railFenceCipher.encrypt('TEST', null), TypeError);
    });
  });

  // ==========================================
  // 4. ROW-COLUMNAR TRANSPOSITION CIPHER
  // ==========================================
  describe('Row-Columnar Transposition Cipher (columnarTranspositionCipher.js)', () => {
    it('ranks columns alphabetically and breaks duplicate-letter ties by original index', () => {
      // Keyword: "GERMAN" -> G(2) E(1) R(5) M(3) A(0) N(4)
      const rankedGerman = columnarTranspositionCipher.getRankedColumns('GERMAN');
      assert.deepEqual(rankedGerman, [4, 1, 0, 3, 5, 2]);

      // Keyword: "SECRET" -> duplicate 'E' at index 1 and index 4
      // Alphabetical: C(2), E(1), E(4), R(3), S(0), T(5)
      // Tie-breaking: index 1 comes before index 4
      const rankedSecret = columnarTranspositionCipher.getRankedColumns('SECRET');
      assert.deepEqual(rankedSecret, [2, 1, 4, 3, 0, 5]);

      // Keyword: "BALLOON" -> B(0), A(1), L(2), L(3), O(4), O(5), N(6)
      // Sorted: A(1), B(0), L(2), L(3), N(6), O(4), O(5)
      const rankedBalloon = columnarTranspositionCipher.getRankedColumns('BALLOON');
      assert.deepEqual(rankedBalloon, [1, 0, 2, 3, 6, 4, 5]);
    });

    it('encrypts and decrypts with complete rectangular grids', () => {
      // 12 chars, key length 4 -> 3 full rows
      const text = 'HELLOWORLD!!';
      const key = 'HACK';
      const encrypted = columnarTranspositionCipher.encrypt(text, key);
      const decrypted = columnarTranspositionCipher.decrypt(encrypted, key);

      assert.equal(decrypted, text);
    });

    it('correctly encrypts and decrypts incomplete final rows without artificial padding', () => {
      // Text: "DEFEND THE EAST WALL OF THE CASTLE" (length 34, 34 % 5 = 4 remainder)
      const text = 'DEFEND THE EAST WALL OF THE CASTLE';
      const key = 'ZEBRA';

      const encrypted = columnarTranspositionCipher.encrypt(text, key);
      assert.equal(encrypted.length, text.length, 'Must NOT append artificial padding characters');

      const decrypted = columnarTranspositionCipher.decrypt(encrypted, key);
      assert.equal(decrypted, text, 'Decrypted text must match exact original incomplete rows');
    });

    it('handles multiple duplicate characters in keyword with incomplete rows', () => {
      const text = 'Classical cryptography demonstrates mathematical permutation!';
      const key = 'MISSISSIPPI'; // Multiple duplicate letters: I, S, P

      const encrypted = columnarTranspositionCipher.encrypt(text, key);
      assert.equal(encrypted.length, text.length);

      const decrypted = columnarTranspositionCipher.decrypt(encrypted, key);
      assert.equal(decrypted, text);
    });

    it('handles edge cases: empty string, single-letter key', () => {
      assert.equal(columnarTranspositionCipher.encrypt('', 'KEYWORD'), '');
      assert.equal(columnarTranspositionCipher.decrypt('', 'KEYWORD'), '');
      assert.equal(columnarTranspositionCipher.encrypt('TEST MESSAGE', 'A'), 'TEST MESSAGE');
      assert.equal(columnarTranspositionCipher.decrypt('TEST MESSAGE', 'A'), 'TEST MESSAGE');
    });

    it('guarantees exact round-trip across diverse inputs and keywords', () => {
      const inputs = [
        'Short',
        'A much longer transmission containing various numbers 123456 and punctuation symbols: @#$!',
        'Exact row length multiple 16 chars.',
        'Non-multiple length of 17 characters!',
        'Multi\nline\twith\rspecial spaces',
      ];

      const keys = ['CIPHER', 'SECURITY', 'KEY', 'CRYPTOGRAPHY', 'ALICE', 'BOB'];

      for (const input of inputs) {
        for (const key of keys) {
          const enc = columnarTranspositionCipher.encrypt(input, key);
          const dec = columnarTranspositionCipher.decrypt(enc, key);
          assert.equal(dec, input, `Round-trip failed for text "${input}" with key "${key}"`);
        }
      }
    });

    it('throws validation error for invalid keys', () => {
      assert.throws(() => columnarTranspositionCipher.encrypt('text', ''), Error);
      assert.throws(() => columnarTranspositionCipher.encrypt('text', '   '), Error);
      assert.throws(() => columnarTranspositionCipher.encrypt('text', null), TypeError);
      assert.throws(() => columnarTranspositionCipher.encrypt('text', 123), TypeError);
    });
  });

  // ==========================================
  // 5. REGISTRY & DISPATCHER
  // ==========================================
  describe('Algorithm Registry & Dispatcher (index.js)', () => {
    it('contains all four supported classical cipher implementations', () => {
      assert.ok(algorithmRegistry.caesar);
      assert.ok(algorithmRegistry.playfair);
      assert.ok(algorithmRegistry.rail_fence);
      assert.ok(algorithmRegistry.columnar_transposition);

      assert.equal(typeof algorithmRegistry.caesar.encrypt, 'function');
      assert.equal(typeof algorithmRegistry.caesar.decrypt, 'function');
      assert.equal(typeof algorithmRegistry.playfair.encrypt, 'function');
      assert.equal(typeof algorithmRegistry.playfair.decrypt, 'function');
      assert.equal(typeof algorithmRegistry.rail_fence.encrypt, 'function');
      assert.equal(typeof algorithmRegistry.rail_fence.decrypt, 'function');
      assert.equal(typeof algorithmRegistry.columnar_transposition.encrypt, 'function');
      assert.equal(typeof algorithmRegistry.columnar_transposition.decrypt, 'function');
    });

    it('retrieves correct cipher via getCipher()', () => {
      assert.equal(getCipher('caesar'), caesarCipher);
      assert.equal(getCipher('playfair'), playfairCipher);
      assert.equal(getCipher('rail_fence'), railFenceCipher);
      assert.equal(getCipher('columnar_transposition'), columnarTranspositionCipher);
    });

    it('throws descriptive error on unsupported algorithm identifier', () => {
      assert.throws(() => getCipher('des_56'), /Unsupported algorithm 'des_56'/);
      assert.throws(() => getCipher('rsa'), /Unsupported algorithm 'rsa'/);
      assert.throws(() => getCipher(null), TypeError);
    });

    it('encrypts and decrypts via universal dispatchers', () => {
      // Caesar
      const c1 = universalEncrypt('caesar', 'HELLO', 3);
      assert.equal(c1, 'KHOOR');
      assert.equal(universalDecrypt('caesar', c1, 3), 'HELLO');

      // Rail Fence
      const c2 = universalEncrypt('rail_fence', 'HELLO WORLD', 3);
      assert.equal(universalDecrypt('rail_fence', c2, 3), 'HELLO WORLD');

      // Columnar Transposition
      const c3 = universalEncrypt('columnar_transposition', 'CONFIDENTIAL', 'SECRET');
      assert.equal(universalDecrypt('columnar_transposition', c3, 'SECRET'), 'CONFIDENTIAL');
    });
  });
});
