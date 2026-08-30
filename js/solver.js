/**
 * Seating Arrangement Solver Module
 */

class SeatingSolver {
  static shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  static solve(classroomManager, studentManager, conditionManager, maxAttempts = 1000) {
    const students = studentManager.students;
    const validDesks = classroomManager.getAllValidDesks();
    const stats = classroomManager.getStats();

    if (students.length > stats.totalCapacity) {
      return {
        success: false,
        message: '좌석이 부족하여 자리 배치를 완료할 수 없습니다. (학생 ' + students.length + '명 > 좌석 ' + stats.totalCapacity + '석)',
        assignment: null,
        attempts: 0
      };
    }

    if (students.length === 0) {
      return {
        success: false,
        message: '배치할 학생이 없습니다.',
        assignment: null,
        attempts: 0
      };
    }

    const pairConditions = conditionManager.pairConditions;
    const avoidConditions = conditionManager.avoidConditions;

    let bestAssignment = null;
    let minViolations = Infinity;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const assignment = {};
      validDesks.forEach(d => {
        assignment[d.id] = [];
      });

      const assignedStudentIds = new Set();
      const doubleDesks = this.shuffle(validDesks.filter(d => d.type === 'double'));
      let doubleDeskIndex = 0;

      // 1. Place Pairs
      const shuffledPairs = this.shuffle(pairConditions);
      let pairFailed = false;

      for (const pair of shuffledPairs) {
        const s1 = studentManager.getById(pair.student1Id);
        const s2 = studentManager.getById(pair.student2Id);
        if (!s1 || !s2) continue;

        if (doubleDeskIndex < doubleDesks.length) {
          const targetDesk = doubleDesks[doubleDeskIndex++];
          if (Math.random() > 0.5) {
            assignment[targetDesk.id].push(s1, s2);
          } else {
            assignment[targetDesk.id].push(s2, s1);
          }
          assignedStudentIds.add(s1.id);
          assignedStudentIds.add(s2.id);
        } else {
          pairFailed = true;
          break;
        }
      }

      if (pairFailed) continue;

      // 2. Prepare remaining empty slots
      const availableSlots = [];
      validDesks.forEach(desk => {
        const currentCount = assignment[desk.id].length;
        const capacity = desk.type === 'double' ? 2 : 1;
        const freeCount = capacity - currentCount;
        for (let i = 0; i < freeCount; i++) {
          availableSlots.push({ deskId: desk.id });
        }
      });

      // 3. Place remaining students
      const remainingStudents = this.shuffle(students.filter(s => !assignedStudentIds.has(s.id)));
      const shuffledSlots = this.shuffle(availableSlots);

      for (let i = 0; i < remainingStudents.length; i++) {
        const st = remainingStudents[i];
        const slot = shuffledSlots[i];
        if (slot) {
          assignment[slot.deskId].push(st);
        }
      }

      // 4. Validate avoid conditions
      let violations = 0;
      for (const avoid of avoidConditions) {
        for (const desk of validDesks) {
          const seated = assignment[desk.id] || [];
          const hasS1 = seated.some(s => s && s.id === avoid.student1Id);
          const hasS2 = seated.some(s => s && s.id === avoid.student2Id);
          if (hasS1 && hasS2) {
            violations++;
          }
        }
      }

      if (violations === 0) {
        return {
          success: true,
          assignment,
          attempts: attempt,
          message: '자리 배치가 완벽하게 성공했습니다.'
        };
      }

      if (violations < minViolations) {
        minViolations = violations;
        bestAssignment = assignment;
      }
    }

    return {
      success: false,
      assignment: bestAssignment,
      attempts: maxAttempts,
      message: '일부 거리두기(같이 앉지 않기) 조건을 ' + minViolations + '건 만족하지 못했습니다. 조건을 완화하거나 다시 시도해주세요.'
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SeatingSolver;
}