/**
 * Classroom Layout Manager (교실 구조 및 책상 그리드 관리)
 * Robust, fail-safe 2D grid management.
 */

class ClassroomManager {
  constructor(rows = 5, cols = 6, podiumPosition = 'top') {
    this.rows = Math.max(1, Math.min(10, parseInt(rows, 10) || 5));
    this.cols = Math.max(1, Math.min(10, parseInt(cols, 10) || 6));
    this.podiumPosition = podiumPosition === 'bottom' ? 'bottom' : 'top';
    this.grid = [];
    this.initGrid();
  }

  initGrid() {
    this.grid = [];
    let deskNumber = 1;
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({
          id: 'desk_' + r + '_' + c,
          row: r,
          col: c,
          deskNumber: deskNumber++,
          type: 'double' // 'single' | 'double' | 'empty'
        });
      }
      this.grid.push(row);
    }
  }

  validateGrid() {
    if (!this.grid || !Array.isArray(this.grid) || this.grid.length !== this.rows) {
      this.initGrid();
      return;
    }
    let deskNumber = 1;
    for (let r = 0; r < this.rows; r++) {
      if (!this.grid[r] || !Array.isArray(this.grid[r]) || this.grid[r].length !== this.cols) {
        this.initGrid();
        return;
      }
      for (let c = 0; c < this.cols; c++) {
        const d = this.grid[r][c];
        if (!d || typeof d !== 'object') {
          this.grid[r][c] = {
            id: 'desk_' + r + '_' + c,
            row: r,
            col: c,
            deskNumber: deskNumber++,
            type: 'double'
          };
        } else {
          d.row = r;
          d.col = c;
          d.id = d.id || ('desk_' + r + '_' + c);
          d.deskNumber = deskNumber++;
          if (!['single', 'double', 'empty'].includes(d.type)) {
            d.type = 'double';
          }
        }
      }
    }
  }

  resize(newRows, newCols) {
    newRows = Math.max(1, Math.min(10, parseInt(newRows, 10) || 1));
    newCols = Math.max(1, Math.min(10, parseInt(newCols, 10) || 1));

    this.validateGrid();

    const oldGrid = this.grid;
    const oldRows = this.rows;
    const oldCols = this.cols;

    this.rows = newRows;
    this.cols = newCols;
    this.grid = [];

    let deskNumber = 1;
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        if (r < oldRows && c < oldCols && oldGrid[r] && oldGrid[r][c]) {
          const oldDesk = oldGrid[r][c];
          row.push({
            id: 'desk_' + r + '_' + c,
            row: r,
            col: c,
            deskNumber: deskNumber++,
            type: oldDesk.type || 'double'
          });
        } else {
          row.push({
            id: 'desk_' + r + '_' + c,
            row: r,
            col: c,
            deskNumber: deskNumber++,
            type: 'double'
          });
        }
      }
      this.grid.push(row);
    }
  }

  toggleDeskType(r, c) {
    this.validateGrid();
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
    const current = this.grid[r][c].type;
    // Rotation: double -> single -> empty -> double
    if (current === 'double') {
      this.grid[r][c].type = 'single';
    } else if (current === 'single') {
      this.grid[r][c].type = 'empty';
    } else {
      this.grid[r][c].type = 'double';
    }
  }

  setDeskType(r, c, type) {
    this.validateGrid();
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
    if (['single', 'double', 'empty'].includes(type)) {
      this.grid[r][c].type = type;
    }
  }

  setAllDeskTypes(type) {
    this.validateGrid();
    if (!['single', 'double', 'empty'].includes(type)) return;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].type = type;
      }
    }
  }

  applyPreset(presetName) {
    if (presetName === '5x6-double') {
      this.resize(5, 6);
      this.setAllDeskTypes('double');
    } else if (presetName === '6x5-single') {
      this.resize(6, 5);
      this.setAllDeskTypes('single');
    } else if (presetName === '4x6-double') {
      this.resize(4, 6);
      this.setAllDeskTypes('double');
    } else if (presetName === '5x5-single') {
      this.resize(5, 5);
      this.setAllDeskTypes('single');
    } else if (presetName === '3-groups') {
      this.resize(5, 8);
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (c === 2 || c === 5) {
            this.grid[r][c].type = 'empty';
          } else {
            this.grid[r][c].type = 'double';
          }
        }
      }
    }
  }

  getStats() {
    this.validateGrid();
    let totalDesks = 0;
    let doubleDesks = 0;
    let singleDesks = 0;
    let emptyDesks = 0;
    let totalCapacity = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const d = this.grid[r][c];
        if (d.type === 'double') {
          totalDesks++;
          doubleDesks++;
          totalCapacity += 2;
        } else if (d.type === 'single') {
          totalDesks++;
          singleDesks++;
          totalCapacity += 1;
        } else {
          emptyDesks++;
        }
      }
    }

    return {
      rows: this.rows,
      cols: this.cols,
      totalDesks,
      doubleDesks,
      singleDesks,
      emptyDesks,
      totalCapacity
    };
  }

  getAllValidDesks() {
    this.validateGrid();
    const list = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const d = this.grid[r][c];
        if (d.type !== 'empty') {
          list.push(d);
        }
      }
    }
    return list;
  }

  toJSON() {
    this.validateGrid();
    return {
      rows: this.rows,
      cols: this.cols,
      podiumPosition: this.podiumPosition,
      grid: this.grid
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.rows = Math.max(1, Math.min(10, parseInt(data.rows, 10) || 5));
    this.cols = Math.max(1, Math.min(10, parseInt(data.cols, 10) || 6));
    this.podiumPosition = data.podiumPosition === 'bottom' ? 'bottom' : 'top';
    if (data.grid && Array.isArray(data.grid) && data.grid.length === this.rows) {
      this.grid = data.grid;
      this.validateGrid();
    } else {
      this.initGrid();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClassroomManager;
}