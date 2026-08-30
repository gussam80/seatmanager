/**
 * Classroom Layout Management Module
 */

class ClassroomManager {
  constructor(defaultRows = 5, defaultCols = 6) {
    this.rows = defaultRows;
    this.cols = defaultCols;
    this.defaultType = 'double'; // 'single' or 'double'
    this.podiumPosition = 'top'; // 'top' or 'bottom'
    this.grid = [];
    this.initGrid();
  }

  initGrid(preserveExisting = false) {
    const oldMap = new Map();
    if (preserveExisting && this.grid.length > 0) {
      for (const row of this.grid) {
        for (const desk of row) {
          oldMap.set(`${desk.row}-${desk.col}`, desk.type);
        }
      }
    }

    const newGrid = [];
    let deskNumber = 1;

    for (let r = 0; r < this.rows; r++) {
      const rowArr = [];
      for (let c = 0; c < this.cols; c++) {
        const key = `${r}-${c}`;
        const existingType = oldMap.get(key);
        const type = existingType !== undefined ? existingType : this.defaultType;
        rowArr.push({
          id: `desk-${r}-${c}`,
          deskNumber: deskNumber++,
          row: r,
          col: c,
          type // 'single', 'double', or 'empty'
        });
      }
      newGrid.push(rowArr);
    }
    this.grid = newGrid;
  }

  resize(rows, cols) {
    this.rows = Math.max(1, Math.min(10, parseInt(rows, 10) || 5));
    this.cols = Math.max(1, Math.min(10, parseInt(cols, 10) || 6));
    this.initGrid(true);
  }

  toggleDeskType(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    const current = this.grid[row][col].type;
    let next = 'double';
    if (current === 'double') next = 'single';
    else if (current === 'single') next = 'empty';
    else if (current === 'empty') next = 'double';

    this.grid[row][col].type = next;
    return next;
  }

  setAllDeskTypes(type) {
    this.defaultType = type;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].type !== 'empty') {
          this.grid[r][c].type = type;
        }
      }
    }
  }

  applyPreset(presetName) {
    if (presetName === '5x6-double') {
      this.rows = 5; this.cols = 6; this.defaultType = 'double'; this.initGrid();
    } else if (presetName === '6x5-single') {
      this.rows = 6; this.cols = 5; this.defaultType = 'single'; this.initGrid();
    } else if (presetName === '4x6-double') {
      this.rows = 4; this.cols = 6; this.defaultType = 'double'; this.initGrid();
    } else if (presetName === '5x5-single') {
      this.rows = 5; this.cols = 5; this.defaultType = 'single'; this.initGrid();
    } else if (presetName === '3-groups') {
      this.rows = 5; this.cols = 6; this.defaultType = 'double'; this.initGrid();
      for (let r = 0;"ÂS²"²²’°¢F†—2æw&–E·%Õ³ÒçG—RÒvV×G’s°¢F†—2æw&–E·%Õ³EÒçG—RÒvV×G’s°¢Ð¢Ð¢Ð ¢vWE7FG2‚’°¢ÆWBF÷FÄFW6·2Ò°¢ÆWB6–ævÆTFW6·2Ò°¢ÆWBF÷V&ÆTFW6·2Ò°¢ÆWBV×G”FW6·2Ò°¢ÆWBF÷FÄ66—G’Ò° ¢f÷"†ÆWB"Ò²"ÂF†—2ç&÷w3²"²²’°¢f÷"†ÆWB2Ò²2ÂF†—2æ6öÇ3²2²²’°¢6öç7BG—RÒF†—2æw&–E·%Õ¶5ÒçG—S°¢–b‡G—RÓÓÒw6–ævÆRr’°¢6–ævÆTFW6·2²³°¢F÷FÄFW6·2²³°¢F÷FÄ66—G’³Ò°¢ÒVÇ6R–b‡G—RÓÓÒvF÷V&ÆRr’°¢F÷V&ÆTFW6·2²³°¢F÷FÄFW6·2²³°¢F÷FÄ66—G’³Ò#°¢ÒVÇ6R°¢V×G”FW6·2²³°¢Ð¢Ð¢Ð ¢&WGW&â°¢&÷w3¢F†—2ç&÷w2À¢6öÇ3¢F†—2æ6öÇ2À¢F÷FÄFW6·2À¢6–ævÆTFW6·2À¢F÷V&ÆTFW6·2À¢V×G”FW6·2À¢F÷FÄ66—G¢Ó°¢Ð ¢vWE6VE6Æ÷G2‚’°¢6öç7B6Æ÷G2ÒµÓ°¢ÆWB6Æ÷D–BÒ° ¢f÷"†ÆWB"Ò²"ÂF†—2ç&÷w3²"²²’°¢f÷"†ÆWB2Ò²2ÂF†—2æ6öÇ3²2²²’°¢6öç7BFW6²ÒF†—2æw&–E·%Õ¶5Ó°¢–b†FW6²çG—RÓÓÒw6–ævÆRr’°¢6Æ÷G2çW6‚‡°¢FW6´–C¢FW6²æ–BÀ¢FW6µ&÷s¢"À¢FW6´6öÃ¢2À¢FW6µG—S¢w6–ævÆRrÀ¢6Æ÷D–æFWƒ¢À¢6Æ÷D¶W“¢G¶FW6²æ–GÒÓÀ¢6Æ÷D–C¢6Æ÷D–B²°¢Ò“°¢ÒVÇ6R–b†FW6²çG—RÓÓÒvF÷V&ÆRr’°¢6Æ÷G2çW6‚‡°¢FW6´–C¢FW6²æ–BÀ¢FW6µ&÷s¢"À¢FW6´6öÃ¢2À¢FW6µG—S¢vF÷V&ÆRrÀ¢6Æ÷D–æFWƒ¢À¢6Æ÷D¶W“¢G¶FW6²æ–GÒÓÀ¢6Æ÷D–C¢6Æ÷D–B²°¢Ò“°¢6Æ÷G2çW6‚‡°¢FW6´–C¢FW6²æ–BÀ¢FW6µ&÷s¢"À¢FW6´6öÃ¢2À¢FW6µG—S¢vF÷V&ÆRrÀ¢6Æ÷D–æFWƒ¢À¢6Æ÷D¶W“¢G¶FW6²æ–GÒÓÀ¢6Æ÷D–C¢6Æ÷D–B²°¢Ò“°¢Ð¢Ð¢Ð¢&WGW&â6Æ÷G3°¢Ð ¢Fô¥4ôâ‚’°¢&WGW&â°¢&÷w3¢F†—2ç&÷w2À¢6öÇ3¢F†—2æ6öÇ2À¢FVfVÇEG—S¢F†—2æFVfVÇEG—RÀ¢öF—VÕ÷6—F–öã¢F†—2çöF—VÕ÷6—F–öâÀ¢w&–C¢F†—2æw&–@¢Ó°¢Ð ¢g&öÔ¥4ôâ†FF’°¢–b‚FF’&WGW&ã°¢F†—2ç&÷w2ÒFFç&÷w2ÇÂS°¢F†—2æ6öÇ2ÒFFæ6öÇ2ÇÂc°¢F†—2æFVfVÇEG—RÒFFæFVfVÇEG—RÇÂvF÷V&ÆRs°¢F†—2çöF—VÕ÷6—F–öâÒFFçöF—VÕ÷6—F–öâÇÂwF÷s°¢–b„'&’æ—4'&’†FFæw&–B’bbFFæw&–BæÆVæwF‚ÓÓÒF†—2ç&÷w2’°¢F†—2æw&–BÒFFæw&–C°¢ÒVÇ6R°¢F†—2æ–æ—Dw&–B‚“°¢Ð¢Ð§Ð 