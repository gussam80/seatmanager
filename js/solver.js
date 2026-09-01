/**
 * Seating Arrangement Solver Module
 * Prioritizes placing students in the front/center rows,
 * placing empty (spare) seats at the back-left and back-right corners of the classroom.
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

  /**
   * Computes priority penalty score for each seat slot.
   * Lower score = front/center (highest priority for students).
   * Higher score = back/outer edges (lowest priority, ideal for empty seats).
   */
  static getSlotPenalty(desk, slotIndex, classroomManager) {
    const rows = classroomManager.rows;
    const cols = classroomManager.cols;
    const podiumPosition = classroomManager.podiumPosition;

    // 0 = front row closest to teacher/blackboard, (rows - 1) = back row furthest from teacher
    const rowDist = podiumPosition === 'bottom' ? (rows - 1 - desk.row) : desk.row;

    let colDist = 0;
    if (desk.type === 'double') {
      const totalWidth = cols * 2;
      const center = (totalWidth - 1) / 2.0;
      const colPos = desk.col * 2 + slotIndex;
      colDist = Math.abs(colPos - center);
    } else {
      const center = (cols - 1) / 2.0;
      colDist = Math.abs(desk.col - center);
    }

    // Row position has primary weight (100), edge distance has secondary weight (10)
    return (rowDist * 100) + (colDist * 10) + (slotIndex * 0.1);
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

    // 1. Build all available slots in the classroom and sort by priority (Front/Center first, Back/Outer last)
    const allSlots = [];
    validDesks.forEach(desk => {
      const capacity = desk.type === 'double' ? 2 : 1;
      for (let slotIndex = 0; slotIndex < capacity; slotIndex++) {
        const penalty = this.getSlotPenalty(desk, slotIndex, classroomManager);
        allSlots.push({
          deskId: desk.id,
          slotIndex: slotIndex,
          desk: desk,
          penalty: penalty
        });
      }
    });

    // Sort ascending: front/center first (small penalty), back-left/back-right last (large penalty)
    allSlots.sort((a, b) => a.penalty - b.penalty);

    // Active student slots = first N slots (front & center)
    // Empty spare slots = remaining slots (back-left & back-right)
    const activeStudentSlots = allSlots.slice(0, students.length);

    const pairConditions = conditionManager.pairConditions;
    const avoidConditions = conditionManager.avoidConditions;

    let bestAssignment = null;
    let minViolations = Infinity;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Initialize empty assignment structure: [null] for single, [null, null] for double
      const assignment = {};
      validDesks.forEach(d => {
        assignment[d.id] = d.type === 'double' ? [null, null] : [null];
      });

      const assignedStudentIds = new Set();
      const usedSlotKeys = new Set();

      // Find all double desks that have BOTH slot 0 and slot 1 in activeStudentSlots
      const deskActiveCount = {};
      activeStudentSlots.forEach(s => {
        deskActiveCount[s.deskId] = (deskActiveCount[s.deskId] || 0) + 1;
      });

      const fullDoubleDeskIds = this.shuffle(
        Object.keys(deskActiveCount).filter(dId => {
          const d = validDesks.find(vd => vd.id === dId);
          return d && d.type === 'double' && deskActiveCount[dId] === 2;
        })
      );

      // 2. Place Pairs in full double desks
      const shuffledPairs = this.shuffle(pairConditions);
      let pairFailed = false;

      for (let pIdx = 0; pIdx < shuffledPairs.length; pIdx++) {
        const pair = shuffledPairs[pIdx];
        const s1 = studentManager.getById(pair.student1Id);
        const s2 = studentManager.getById(pair.student2Id);
        if (!s1 || !s2) continue;

        if (pIdx < fullDoubleDeskIds.length) {
          const targetDeskId = fullDoubleDeskIds[pIdx];
          if (Math.random() > 0.5) {
            assignment[targetDeskId][0] = s1;
            assignment[targetDeskId][1] = s2;
          } else {
            assignment[targetDeskId][0] = s2;
            assignment[targetDeskId][1] = s1;
          }
          assignedStudentIds.add(s1.id);
          assignedStudentIds.add(s2.id);
          usedSlotKeys.add(targetDeskId + '_0');
          usedSlotKeys.add(targetDeskId + '_1');
        } else {
          pairFailed = true;
          break;
        }
      }

      if (pairFailed) continue;

      // 3. Collect remaining available active student slots
      const remainingSlots = activeStudentSlots.filter(
        s => !usedSlotKeys.has(s.deskId + '_' + s.slotIndex)
      );

      const remainingStudents = this.shuffle(
        students.filter(s => !assignedStudentIds.has(s.id))
      );

      const shuffledRemSlots = this.shuffle(remainingSlots);

      for (let i = 0; i < remainingStudents.length; i++) {
        const st = remainingStudents[i];
        const slot = shuffledRemSlots[i];
        if (slot) {
          assignment[slot.deskId][slot.slotIndex] = st;
        }
      }

      // 4. Validate Avoid conditions (거리두기)
      let violations = 0;
      for (const avoid of avoidConditions) {
        for (const desk of validDesks) {
          const seated = assignment[desk.id] || [];
          if (seated[0] && seated[1]) {
            const hasS1 = (seated[0].id === avoid.student1Id || seated[1].id === avoid.student1Id);
            const hasS2 = (seated[0].id === avoid.student2Id || seated[1].id === avoid.student2Id);
            if (hasS1 && hasS2) {
              violations++;
            }
          }
        }
      }

      if (violations === 0) {
        return {
          success: true,
          assignment: assignment,
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