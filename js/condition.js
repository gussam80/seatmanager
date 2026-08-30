/**
 * Seating Constraints & Real-time Conflict Validation Module
 */

class ConditionManager {
  constructor() {
    this.pairConditions = []; // [ { id, student1Id, student2Id } ]
    this.avoidConditions = []; // [ { id, student1Id, student2Id } ]
  }

  addPair(student1Id, student2Id) {
    if (!student1Id || !student2Id) {
      throw new Error('짝궁으로 지정할 두 학생을 모두 선택해주세요.');
    }
    if (student1Id === student2Id) {
      throw new Error('동일한 학생을 짝궁으로 지정할 수 없습니다.');
    }

    const exists = this.pairConditions.some(
      p => (p.student1Id === student1Id && p.student2Id === student2Id) ||
           (p.student1Id === student2Id && p.student2Id === student1Id)
    );
    if (exists) {
      throw new Error('이미 등록된 같이 앉기 조건입니다.');
    }

    const s1HasPair = this.pairConditions.find(p => p.student1Id === student1Id || p.student2Id === student1Id);
    if (s1HasPair) {
      throw new Error('한 학생은 하나의 짝궁만 가질 수 있습니다. (중복 짝궁 지정 불가)');
    }
    const s2HasPair = this.pairConditions.find(p => p.student1Id === student2Id || p.student2Id === student2Id);
    if (s2HasPair) {
      throw new Error('한 학생은 하나의 짝궁만 가질 수 있습니다. (중복 짝궁 지정 불가)');
    }

    const newPair = {
      id: 'pair_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      student1Id,
      student2Id
    };
    this.pairConditions.push(newPair);
    return newPair;
  }

  removePair(id) {
    this.pairConditions = this.pairConditions.filter(p => p.id !== id);
  }

  addAvoid(student1Id, student2Id) {
    if (!student1Id || !student2Id) {
      throw new Error('떨어져 앉을 두 학생을 모두 선택해주세요.');
    }
    if (student1Id === student2Id) {
      throw new Error('동일한 학생을 떨어져 앉기로 지정할 수 없습니다.');
    }

    const exists = this.avoidConditions.some(
      a => (a.student1Id === student1Id && a.student2Id === student2Id) ||
           (a.student1Id === student2Id && a.student2Id === student1Id)
    );
    if (exists) {
      throw new Error('이미 등록된 같이 앉지 않기 조건입니다.');
    }

    const newAvoid = {
      id: 'avoid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      student1Id,
      student2Id
    };
    this.avoidConditions.push(newAvoid);
    return newAvoid;
  }

  removeAvoid(id) {
    this.avoidConditions = this.avoidConditions.filter(a => a.id !== id);
  }

  clearAll() {
    this.pairConditions = [];
    this.avoidConditions = [];
  }

  cleanupOrphaned(validStudentIdsSet) {
    this.pairConditions = this.pairConditions.filter(
      p => validStudentIdsSet.has(p.student1Id) && validStudentIdsSet.has(p.student2Id)
    );
    this.avoidConditions = this.avoidConditions.filter(
      a => validStudentIdsSet.has(a.student1Id) && validStudentIdsSet.has(a.student2Id)
    );
  }

  validateConflicts(studentManager, classroomManager) {
    const diagnostics = [];
    const stats = classroomManager.getStats();
    const students = studentManager.students;

    if (students.length > stats.totalCapacity) {
      diagnostics.push({
        type: 'error',
        message: '🚨 교실 좌석 수(' + stats.totalCapacity + '석)보다 학생 수(' + students.length + '명)가 ' + (students.length - stats.totalCapacity) + '명 더 많습니다! 책상을 추가해주세요.'
      });
    }

    if (this.pairConditions.length > stats.doubleDesks) {
      diagnostics.push({
        type: 'warning',
        message: '⚠️ 같이 앉기 조건 수(' + this.pairConditions.length + '쌍)가 교실 내 2인석 책상 수(' + stats.doubleDesks + '개)보다 많습니다. 일부 짝궁이 배치되지 못할 수 있습니다.'
      });
    }

    for (const pair of this.pairConditions) {
      const isContradicted = this.avoidConditions.some(
        a => (a.student1Id === pair.student1Id && a.student2Id === pair.student2Id) ||
             (a.student1Id === pair.student2Id && a.student2Id === pair.student1Id)
      );
      if (isContradicted) {
        const s1 = studentManager.getById(pair.student1Id);
        const s2 = studentManager.getById(pair.student2Id);
        const name1 = s1 ? s1.name : '학생1';
        const name2 = s2 ? s2.name : '학생2';
        diagnostics.push({
          type: 'error',
          message: '🚨 상호 모순: [' + name1 + '] 학생과 [' + name2 + '] 학생이 [같이 앉기]와 [같이 앉지 않기]에 동시에 지정되어 있습니다!'
        });
      }
    }

    return diagnostics;
  }

  toJSON() {
    return {
      pairs: this.pairConditions,
      avoids: this.avoidConditions
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.pairConditions = data.pairs || [];
    this.avoidConditions = data.avoids || [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionManager;
}