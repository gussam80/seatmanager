/**
 * Dedicated Print & Export Helper Module
 * Displays strictly: 학급, 담임, and 좌석 배치도
 */

class PrintHelper {
  static prepareAndPrint(className, seatingDate, studentCount, teacherName) {
    const printTitleElem = document.getElementById('print-display-title');
    const printClassElem = document.getElementById('print-display-class');
    const printTeacherElem = document.getElementById('print-display-teacher');

    if (printTitleElem) {
      printTitleElem.textContent = (className ? className + ' ' : '') + '자리 배치표';
    }
    if (printClassElem) {
      printClassElem.textContent = '학급: ' + (className || '우리 반');
    }
    if (printTeacherElem) {
      printTeacherElem.textContent = '담임: ' + (teacherName || '_______________') + ' (서명)';
    }

    setTimeout(() => {
      window.print();
    }, 150);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrintHelper;
}