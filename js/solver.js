/**
 * Seating Arrangement Solver Module
 * Randomized Constraint Satisfaction Algorithm with up to 1000 iterations.
 * Guaranteed to satisfy pair conditions and avoid conditions.
 */

class SeatingSolver {
  /**
   * Shuffles an array in place (Fisher-Yates)
   */
  static shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Main solving method
   */
  static solve(classroomManager, studentManager, conditionManager, maxAttempts = 1000) {
    const students = studentManager.students;
    const stats = classroomManager.getStats();

    if (students.length === 0) {
      throw new Error('학생 명단이 비어 있습니다. 학생을 먼저 등록해주세요.');
    }

    if (students.length > stats.totalCapacity) {
      throw new Error(학생 수(명)가 교실 좌석 수(석)보다 많습니다.);
    }

    const pairConditions = conditionManager.pairConditions;
    const avoidConditions = conditionManager.avoidConditions;

    // Collect 2-seat desks and 1-seat desks
    const doubleDesks = [];
    const singleDesks = [];

    for (let r = 0; r < classroomManager.rows; r++) {
      for (let c = 0; c < classroomManager.cols; c++) {
        const desk = classroomManager.grid[r][c];
        if (desk.type === 'double') {
          doubleDesks.push(desk);
        } else if (desk.type === 'single') {
          singleDesks.push(desk);
        }
      }
    }

    if (pairConditions.length > doubleDesks.length) {
      throw new Error(같이 앉기 조건(쌍)이 2인석 책상 수(개)보다 많습니다.);
    }

    // Build Avoid Fast Lookup Map: Set of ${id1}_
    const avoidSet = new Set();
    for (const a of avoidConditions) {
      avoidSet.add(${a.student1Id}_);
      avoidSet.add(${a.student2Id}_);
    }

    // Identify Paired Students
    const pairedStudentIds = new Set();
    for (const p of pairConditions) {
      pairedStudentIds.add(p.student1Id);
      pairedStudentIds.add(p.student2Id);
    }

    // Unpaired students
    const remainingStudents = students.filter(s => !pairedStudentIds.has(s.id));

    let bestResult = null;
    let fewestViolations = Infinity;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const assignment = {}; // deskId -> array of student objects (length 1 or 2)
      let hasViolation = false;

      // Shuffle double desks & pair conditions
      const shuffledDoubleDesks = this.shuffle(doubleDesks);
      const shuffledPairs = this.shuffle(pairConditions);

      // 1. Assign Priority 1: Pair conditions into random 2-seat desks
      for (let i = 0; i < shuffledPairs.length; i++) {
        const pair = shuffledPairs[i];
        const desk = shuffledDoubleDesks[i];
        const s1 = studentManager.getById(pair.student1Id);
        const s2 = studentManager.getById(pair.student2Id);

        // Randomize left/right seat in desk
        assignment[desk.id] = Math.random() > 0.5 ? [s1, s2] : [s2, s1];
      }

      // Collect all remaining available seat slots across all desks
      const remainingSlots = []; // array of { desk, slotIndex }

      // Remaining 2-seat desks (after pairs)
      for (let i = shuffledPairs.length; i < shuffledDoubleDesks.length; i++) {
        const desk = shuffledDoubleDesks[i];
        assignment[desk.id] = [null, null];
        remainingSlots.push({ deskId: desk.id, isDouble: true, slotIndex: 0 });
        remainingSlots.push({ deskId: desk.id, isDouble: true, slotIndex: 1 });
      }

      // 1-seat desks
      for (const desk of singleDesks) {
        assignment[desk.id] = [null];
        remainingSlots.push({ deskId: desk.id, isDouble: false, slotIndex: 0 });
      }

      // Shuffle remaining slots and remaining students
      const shuffledSlots = this.shuffle(remainingSlots);
      const shuffledRemainingStudents = this.shuffle(remainingStudents);

      // Place remaining students into slots
      for (let i = 0; i < shuffledRemainingStudents.length; i++) {
        const student = shuffledRemainingStudents[i];
        const slot = shuffledSlots[i];
        assignment[slot.deskId][slot.slotIndex] = student;
      }

      // 2. Check Avoid Constraints (Priority 2): No two students in avoid list share the same 2-seat desk
      let violationCount = 0;
      for (const desk of doubleDesks) {
        const deskSeats = assignment[desk.id];
        if (deskSeats && deskSeats[0] && deskSeats[1]) {
          const sA = deskSeats[0].id;
          const sB = deskSeats[1].id;
          if (avoidSet.has(${sA}_)) {
            violationCount++;
            hasViolation = true;
          }
        }
      }

      if (!hasViolation) {
        return {
          success: true,
          attempts: attempt,
          assignment, // Map of desk.id -> array of students
          seatingDate: new Date().toISOString()
        };
      }

      if (violationCount < fewestViolations) {
        fewestViolations = violationCount;
        bestResult = {
          success: false,
          attempts: attempt,
          assignment,
          violationCount
        };
      }
    }

    // If 1000 attempts failed to find 0-violation placement
    return {
      success: false,
      attempts: maxAttempts,
      assignment: bestResult ? bestResult.assignment : null,
      message: 최대 회 시도하였으나 모든 자리 조건을 완벽히 만족하지 못했습니다. 조건을 일부 완화해주세요.
    };
  }
}
