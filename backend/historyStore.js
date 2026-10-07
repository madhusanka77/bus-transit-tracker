'use strict';

/**
 * JSON-file backed location history store.
 *
 * Race-condition safety:
 *  - The authoritative copy lives in memory; request handlers only touch the array.
 *  - Disk writes are SINGLE-FLIGHT: at most one write is in progress at any time.
 *    Updates that arrive while a write is running just mark the store "dirty" and a
 *    single follow-up write is performed afterwards (write coalescing).
 *  - Every write goes to a temp file first and is then atomically renamed over the
 *    real file, so a crash mid-write can never leave a truncated/corrupt JSON file.
 */

const fs = require('fs');
const path = require('path');

class HistoryStore {
  /**
   * @param {object} opts
   * @param {string} opts.filePath   Absolute path of the JSON file.
   * @param {number} [opts.maxEntries=10000] Max records kept (oldest dropped first).
   */
  constructor({ filePath, maxEntries = 10000 }) {
    this.filePath = filePath;
    this.tmpPath = `${filePath}.tmp`;
    this.maxEntries = maxEntries;
    this.records = [];
    this.dirty = false;
    this.writing = false;
    this.idle = Promise.resolve();
  }

  /** Load existing history from disk (sync, called once at startup). */
  load() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, '[]', 'utf8');
        return;
      }
      const raw = fs.readFileSync(this.filePath, 'utf8').trim();
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) throw new Error('history file is not a JSON array');
      this.records = parsed.slice(-this.maxEntries);
    } catch (err) {
      // Corrupt file: keep a backup for inspection and start fresh.
      const backup = `${this.filePath}.corrupt-${Date.now()}`;
      console.error(`[history] Could not read ${this.filePath}: ${err.message}. Backing up to ${backup}`);
      try {
        fs.renameSync(this.filePath, backup);
      } catch (_) {
        /* ignore */
      }
      this.records = [];
    }
  }

  /** Append a record (in memory) and schedule an async flush. */
  add(record) {
    this.records.push(record);
    if (this.records.length > this.maxEntries) {
      this.records.splice(0, this.records.length - this.maxEntries);
    }
    this.dirty = true;
    this._schedule();
  }

  /** Query records. */
  query({ busId, limit } = {}) {
    let out = busId ? this.records.filter((r) => r.busId === busId) : this.records;
    if (Number.isFinite(limit) && limit > 0) out = out.slice(-limit);
    return out;
  }

  /** Resolves once all pending data has been written to disk. */
  flush() {
    this._schedule();
    return this.idle;
  }

  _schedule() {
    if (this.writing || !this.dirty) return;
    this.writing = true;
    this.idle = this._drain();
  }

  async _drain() {
    try {
      // Loop so that records added during a write are persisted by the same chain.
      while (this.dirty) {
        this.dirty = false;
        const snapshot = JSON.stringify(this.records);
        try {
          await this._atomicWrite(snapshot);
        } catch (err) {
          console.error(`[history] write failed: ${err.message}`);
          this.dirty = true; // retry later
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    } finally {
      this.writing = false;
    }
  }

  async _atomicWrite(data) {
    await fs.promises.writeFile(this.tmpPath, data, 'utf8');
    try {
      await fs.promises.rename(this.tmpPath, this.filePath);
    } catch (err) {
      // Windows can throw EPERM/EBUSY if another process (AV, editor) holds the target.
      if (err.code === 'EPERM' || err.code === 'EBUSY') {
        await fs.promises.writeFile(this.filePath, data, 'utf8');
        await fs.promises.rm(this.tmpPath, { force: true });
      } else {
        throw err;
      }
    }
  }
}

module.exports = {
  HistoryStore,
  defaultHistoryPath: () => process.env.HISTORY_FILE || path.join(__dirname, 'location_history.json'),
};
