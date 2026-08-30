/**
 * Seating Constraints & Real-time Conflict Validation Module
 * Manages 'Pair together' (같이 앉기) and 'Keep apart' (같이 앉지 않기) conditions.
 */

class ConditionManager {
  constructor() {
    this.pairConditions = []; // [ { id, student1Id, student2Id } ]
    this.avoidConditions = []; // [ { id, student1Id, student2Id } ]
  }

  /**
   * Adds a pair condition (A and B must sit in the same 2-person desk)
   */
  addPair(student1Id, student2Id) {
    if (!student1Id || !student2Id) {
      throw new Error('두 명의 학생을 모두 선택해주세요.');
    }
    if (student1Id === student2Id) {
      throw new Error('동일한 학생을 짝궁으로 지정할 수 없습니다.');
    }

    // Check if already paired
    const exists = this.pairConditions.some(
      c => (c.student1Id === student1Id && c.student2Id === student2Id) ||
           (c.student1Id === student2Id && c.student2Id === student1Id)
    );
    if (exists) {
      throw new Error('이미 등록된 같이 앉기 조건입니다.');
    }

    // Check if either student is already in another pair
    const s1Paired = this.pairConditions.find(c => c.student1Id === student1Id || c.student2Id === student1Id);
    const s2Paired = this.pairConditions.find(c => c.student1Id === student2Id || c.student2Id === student2Id);

    if (s1Paired || s2Paired) {
      throw new Error('한 학생은 하나의 2인 좌석 짝으로만 지정될 수 있습니다.');
    }

    const newPair = {
      id: pair__,
      student1Id,
      student2Id
    };
    this.pairConditions.push(newPair);
    return newPair;
  }

  /**
   * Removes a pair condition
   */
  removePair(conditionId) {
    this.pairConditions = this.pairConditions.filter(c => c.id !== conditionId);
  }

  /**
   * Adds an avoid condition (A and B must NOT share the same desk)
   */
  addAvoid(student1Id, student2Id) {
    if (!student1Id || !student2Id) {
      throw new Error('두 명의 학생을 모두 선택해주세요.');
    }
    if (student1Id === student2Id) {
      throw new Error('동일한 학생을 지정할 수 없습니다.');
    }

    const exists = this.avoidConditions.some(
      c => (c.student1Id === student1Id && c.student2Id === student2Id) ||
           (c.student1Id === student2Id && c.student2Id === student1Id)
    );
    if (exists) {
      throw new Error('이미 등록된 같이 앉지 않기 조건입니다.');
    }

    const newAvoid = {
      id: void__,
      student1Id,
      student2Id
    };
    this.avoidConditions.push(newAvoid);
    return newAvoid;
  }

  /**
   * Removes an avoid condition
   */
  removeAvoid(conditionId) {
    this.avoidConditions = this.avoidConditions.filter(c => c.id !== conditionId);
  }

  /**
   * Clears all conditions
   */
  clearAll() {
    this.pairConditions = [];
    this.avoidConditions = [];
  }

  /**
   * Cleans conditions referencing deleted students
   */
  cleanupOrphaned(studentIdsSet) {
    this.pairConditions = this.pairConditions.filter(
      c => studentIdsSet.has(c.student1Id) && studentIdsSet.has(c.student2Id)
    );
    this.avoidConditions = this.avoidConditions.filter(
      c => studentIdsSet.has(c.student1Id) && studentIdsSet.has(c.student2Id)
    );
  }

  /**
   * Performs deep conflict checks and returns diagnostic messages
   */
  validateConflicts(studentManager, classroomManager) {
    const diagnostics = [];
    const students = studentManager.students;
    const stats = classroomManager.getStats();

    // 1. Capacity check
    if (students.length > stats.totalCapacity) {
      diagnostics.push({
        type: 'danger',
        message: ⚠️ 학생 수(명)가 교실 전체 좌석(석)보다 많습니다. 교실 구조를 늘려주세요.
      });
    }

    // 2. 2-person desk vs Pair conditions check
    if (this.pairConditions.length > stats.doubleDesks) {
      diagnostics.push({
        type: 'warning',
        message: ⚠️ 같이 앉기 조건(쌍)이 교실의 2인석 책상 수(개)보다 많습니다. 2인석을 추가해주세요.
      });
    }

    // 3. Contradiction check: Same pair in both Pair and Avoid
    for (const pair of this.pairConditions) {
      const isAvoided = this.avoidConditions.some(
        a => (a.student1Id === pair.student1Id && a.student2Id === pair.student2Id) ||
             (a.student1Id === pair.student2Id && a.student2Id === pair.student1Id)
      );
      if (isAvoided) {
        const s1 = studentManager.getById(pair.student1Id);
        const s2 = studentManager.getById(pair.student2Id);
        const s1Name = s1 ? s1.name : '알 수 없음';
        const s2Name = s2 ? s2.name : '알 수 없음';
        diagnostics.push({
          type: 'danger',
          message: ⚠️ 와  학생의 자리 조건이 서로 충돌합니다. (같이 앉기와 같이 앉지 않기에 동시에 등록됨)
        });
      }
    }

    return diagnostics;
  }

  toJSON() {
    return {
      pairConditions: this.pairConditions,
      avoidConditions: this.avoidConditions
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.pairConditions = Array.isArray(data.pairConditions) ? data.pairConditions : [];
    this.avoidConditions = Array.isArray(data.avoidConditions) ? data.avoidConditions : [];
  }
}
