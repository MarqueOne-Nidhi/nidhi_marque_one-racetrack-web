import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

/**
 * Runs docs/apps-script/Code.gs under fake Google services.
 *
 * Code.gs is not a module. It is a flat script of globals that Google
 * evaluates in its own runtime, so it cannot be imported; it is evaluated in a
 * vm context whose globals are stand-ins for SpreadsheetApp, MailApp and the
 * rest. The context object is then the script's exports.
 *
 * One thing to know about the vm: it is a separate realm, so a Date built
 * inside Code.gs is not `instanceof` the Date here. Check `constructor.name`
 * instead, or assert on something the script derived from the date.
 */

const CODE_PATH = path.join(process.cwd(), 'docs', 'apps-script', 'Code.gs');
const MAX_ROWS = 1000;

/** A fake sheet. `grid` is a 2D array; row 1 is the header row. */
export function makeSheet(name, grid) {
  const cells = grid ? grid.map((r) => r.slice()) : [];
  const formats = {}; // "row:col" -> number format string
  const meta = { widths: {}, frozen: 0, filter: null, deleted: [], styled: [] };

  const at = (r, c) =>
    cells[r - 1] && cells[r - 1][c - 1] !== undefined ? cells[r - 1][c - 1] : '';

  const getRange = (row, col, nRows = 1, nCols = 1) => {
    const self = {
      getValues() {
        const out = [];
        for (let r = row; r < row + nRows; r++) {
          const line = [];
          for (let c = col; c < col + nCols; c++) line.push(at(r, c));
          out.push(line);
        }
        return out;
      },
      getValue: () => at(row, col),
      setValues(values) {
        values.forEach((line, i) => {
          const r = row + i - 1;
          while (cells.length <= r) cells.push([]);
          line.forEach((value, j) => {
            const c = col + j - 1;
            while (cells[r].length < c) cells[r].push('');
            cells[r][c] = value;
          });
        });
        return self;
      },
      setNumberFormat(format) {
        for (let r = row; r < row + nRows; r++)
          for (let c = col; c < col + nCols; c++) formats[`${r}:${c}`] = format;
        return self;
      },
      setNumberFormats(rows) {
        rows.forEach((line, i) =>
          line.forEach((format, j) => {
            formats[`${row + i}:${col + j}`] = format;
          })
        );
        return self;
      },
      setFontWeight: () => self,
      setBackground: () => self,
      setFontColor: () => self,
      setVerticalAlignment() {
        meta.styled.push([col, nCols]);
        return self;
      },
      createFilter() {
        if (meta.filter) throw new Error('Sheet already has a filter');
        meta.filter = true;
        return {};
      },
    };
    return self;
  };

  return {
    _name: name,
    _cells: cells,
    _formats: formats,
    _meta: meta,
    /** Header row, trailing blanks trimmed. */
    headers() {
      const row = (cells[0] || []).map(String);
      while (row.length && row[row.length - 1] === '') row.pop();
      return row;
    },
    /** Data rows as objects keyed by header. */
    records() {
      const headers = this.headers();
      return cells.slice(1).map((row) =>
        headers.reduce((acc, h, i) => {
          acc[h] = row[i] === undefined ? '' : row[i];
          return acc;
        }, {})
      );
    },
    getName: () => name,
    getRange,
    getLastRow: () => cells.length,
    getLastColumn: () => cells.reduce((m, r) => Math.max(m, r.length), 0),
    getMaxRows: () => MAX_ROWS,
    setFrozenRows(n) {
      meta.frozen = n;
    },
    getFilter: () => meta.filter,
    setColumnWidth(c, w) {
      meta.widths[c] = w;
    },
    deleteColumn(index) {
      meta.deleted.push(index);
      cells.forEach((row) => row.splice(index - 1, 1));
    },
  };
}

export function makeBook(sheets = []) {
  const map = new Map(sheets.map((s) => [s._name, s]));
  return {
    getSheetByName: (n) => map.get(n) || null,
    insertSheet(n) {
      const sheet = makeSheet(n);
      map.set(n, sheet);
      return sheet;
    },
    _sheets: map,
    tab(name) {
      return map.get(name);
    },
  };
}

/**
 * Evaluates Code.gs against a book.
 *
 * @param {object|null} book        null simulates a standalone, unbound script
 * @param {Function}   [onSendMail] throw from here to simulate a mail failure
 */
export function loadAppsScript(book, onSendMail) {
  const sent = [];
  const logs = [];
  const errors = [];

  const sandbox = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => book,
      openById: () => book,
    },
    MailApp: {
      sendEmail(options) {
        if (onSendMail) onSendMail(options);
        sent.push(options);
      },
    },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata' },
    Utilities: {
      formatDate: (date) => date.toISOString().slice(0, 16).replace('T', ' '),
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text) => ({ setMimeType: () => ({ _body: text }) }),
    },
    console: {
      log: (...args) => logs.push(args.join(' ')),
      error: (...args) => errors.push(String(args[0])),
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(CODE_PATH, 'utf8'), sandbox);

  return {
    api: sandbox,
    sent,
    logs,
    errors,
    /** POST a JSON body the way the site does. */
    post(form, fields) {
      return JSON.parse(
        sandbox.doPost({ postData: { contents: JSON.stringify({ form, fields }) } })._body
      );
    },
    /** POST form-encoded, the way an older build or a curl test would. */
    postForm(parameter) {
      return JSON.parse(sandbox.doPost({ parameter })._body);
    },
    get() {
      return JSON.parse(sandbox.doGet()._body);
    },
  };
}

/** The declared column order for a form, read from Code.gs itself. */
export function headersFor(form) {
  const { api } = loadAppsScript(makeBook());
  return api.FORMS[form].headers.slice();
}

/** The names the Apps Script editor offers in its Run dropdown. */
export function runnableFunctions() {
  const source = fs.readFileSync(CODE_PATH, 'utf8');
  return [...source.matchAll(/^function (\w+)/gm)].map((m) => m[1]);
}
