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

    if (printTitleElem) printTitleElem.textContent = '우리 반 자리 배치표';
    if (printClassElem) printClassElem.textContent = className ? 학급명:  : '학급명: ____________';
    if (printDateElem) printDateElem.textContent = 자리 바꾸기 날짜: ;
    if (printCountElem) printCountElem.textContent = 학생 수: 명;
    if (printTeacherElem) printTeacherElem.textContent = 담임교사: ;

    window.print();
  }
}
