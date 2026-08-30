/**
 * LocalStorage & Data Backup/Restore Management Module
 */

class StorageManager {
  static KEYS = {
    LAYOUT: 'csm_classroom_layout',
    STUDENTS: 'csm_students',
    CONDITIONS: 'csm_conditions',
    CURRENT_SEATING: 'csm_current_seating',
    HISTORY: 'csm_seating_history',
    SETTINGS: 'csm_app_settings'
  };

  static saveActiveState(layout, students, conditions, seating, settings) {
    try {
      if (layout) localStorage.setItem(this.KEYS.LAYOUT, JSON.stringify(layout.toJSON()));
      if (students) localStorage.setItem(this.KEYS.STUDENTS, JSON.stringify(students.toJSON()));
      if (conditions) localStorage.setItem(this.KEYS.CONDITIONS, JSON.stringify(conditions.toJSON()));
      if (seating) localStorage.setItem(this.KEYS.CURRENT_SEATING, JSON.stringify(seating));
      if (settings) localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
    }
  }

  static loadActiveState() {
    try {
      return {
        layout: JSON.parse(localStorage.getItem(this.KEYS.LAYOUT) || 'null'),
        students: JSON.parse(localStorage.getItem(this.KEYS.STUDENTS) || 'null'),
        conditions: JSON.parse(localStorage.getItem(this.KEYS.CONDITIONS) || 'null'),
        currentSeating: JSON.parse(localStorage.getItem(this.KEYS.CURRENT_SEATING) || 'null'),
        settings: JSON.parse(localStorage.getItem(this.KEYS.SETTINGS) || 'null')
      };
    } catch (e) {
      console.error('Failed to load from LocalStorage:', e);
      return {};
    }
  }

  static saveToHistory(record) {
    try {
      const history = this.getHistory();
      const newRecord = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: record.title || (new Date().toLocaleDateString('ko-KR') + ' 자리배치'),
        date: record.date || new Date().toISOString().slice(0, 10),
        timestamp: Date.now(),
        studentCount: record.studentCount || 0,
        layout: record.layout,
        students: record.students,
        conditions: record.conditions,
        seating: record.seating
      };
      history.unshift(newRecord);
      localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
      return newRecord;
    } catch (e) {
      console.error('Failed to save to history:', e);
      throw e;
    }
  }

  static getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.HISTORY) || '[]');
    } catch (e) {
      return [];
    }
  }

  static deleteHistoryRecord(id) {
    try {
      const history = this.getHistory().filter(h => h.id !== id);
      localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to delete history record:', e);
    }
  }

  static clearAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }

  static exportJSON() {
    const exportData = {
      app: 'ClassroomSeatManager',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      layout: JSON.parse(localStorage.getItem(this.KEYS.LAYOUT) || 'null'),
      students: JSON.parse(localStorage.getItem(this.KEYS.STUDENTS) || 'null'),
      conditions: JSON.parse(localStorage.getItem(this.KEYS.CONDITIONS) || 'null'),
      currentSeating: JSON.parse(localStorage.getItem(this.KEYS.CURRENT_SEATING) || 'null'),
      history: this.getHistory()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', '우리반자리바꾸기_백업_' + new Date().toISOString().slice(0, 10) + '.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  static async importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data || typeof data !== 'object') {
            throw new Error('유효하지 않은 백업 파일입니다.');
          }

          if (data.layout) localStorage.setItem(this.KEYS.LAYOUT, JSON.stringify(data.layout));
          if (data.students) localStorage.setItem(this.KEYS.STUDENTS, JSON.stringify(data.students));
          if (data.conditions) localStorage.setItem(this.KEYS.CONDITIONS, JSON.stringify(data.conditions));
          if (data.currentSeating) localStorage.setItem(this.KEYS.CURRENT_SEATING, JSON.stringify(data.currentSeating));
          if (data.history) localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(data.history));

          resolve(data);
        } catch (err) {
          reject(new Error('파일 데이터를 불러오는데 실패했습니다: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsText(file);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}