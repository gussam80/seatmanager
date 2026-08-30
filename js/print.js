/**
 * Dedicated Print & Export Helper Module
 */

class PrintHelper {
  static prepareAndPrint(className, seatingDate, studentCount, teacherName) {
    const printTitleElem = document.getElementById('print-display-title');
    const printClassElem = document.getElementById('print-display-class');
    const printDateElem = document.getElementById('print-display-date');
    const printCountElem = document.getElementById('print-display-count');
    const printTeacherElem = document.getElementById('print-display-teacher');

    if (printTitleElem) {
      printTitleElem.textContent = (className ? className + ' ' : '') + '자리 배치표';
    }
    if (printClassElem) {
      printClassElem.textContent = '학급명: ' + (className || '우리 반');
    }
    if (printDateElem) {
      printDateElem.textContent = '자리 바꾸기 날짜: ' + (seatingDate || new Date().toISOString().slice(0, 10));
    }
    if (printCountElem) {
      printCountElem.textContent = '학생 수: ' + studentCount + '명';
    }
    if (printTeacherElem) {
      printTeacherElem.textContent = '담임교사: ' + (teacherName || '_______________') + ' (서명)';
    }

    setTimeout(() => {
      window.print();
    }, 100);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrintHelper;
}