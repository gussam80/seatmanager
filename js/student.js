/**
 * Student Roster & Excel Import/Export Management Module
 * Supports Excel (.xlsx, .xls, .csv) upload, template generation,
 * student list CRUD, and gender tagging.
 */

class StudentManager {
  constructor() {
    this.students = [];
    this.loadDefaultSample();
  }

  /**
   * Loads realistic default Korean student roster (25 students)
   */
  loadDefaultSample() {
    const sampleNames = [
      { num: 1, name: '김민수', gender: '남' },
      { num: 2, name: '이서연', gender: '여' },
      { num: 3, name: '박지훈', gender: '남' },
      { num: 4, name: '최유진', gender: '여' },
      { num: 5, name: '정우진', gender: '남' },
      { num: 6, name: '한지민', gender: '여' },
      { num: 7, name: '이도윤', gender: '남' },
      { num: 8, name: '김하늘', gender: '여' },
      { num: 9, name: '박정우', gender: '남' },
      { num: 10, name: '윤서아', gender: '여' },
      { num: 11, name: '조민재', gender: '남' },
      { num: 12, name: '신예은', gender: '여' },
      { num: 13, name: '배준혁', gender: '남' },
      { num: 14, name: '오수아', gender: '여' },
      { num: 15, name: '송성민', gender: '남' },
      { num: 16, name: '권채원', gender: '여' },
      { num: 17, name: '황도현', gender: '남' },
      { num: 18, name: '송다은', gender: '여' },
      { num: 19, name: '유승우', gender: '남' },
      { num: 20, name: '서지안', gender: '여' },
      { num: 21, name: '문태양', gender: '남' },
      { num: 22, name: '안소율', gender: '여' },
      { num: 23, name: '박진우', gender: '남' },
      { num: 24, name: '양하은', gender: '여' },
      { num: 25, name: '차은우', gender: '남' }
    ];

    this.students = sampleNames.map((s, idx) => ({
      id: std_,
      number: s.num,
      name: s.name,
      gender: s.gender
    }));
  }

  /**
   * Adds a new student
   */
  addStudent(number, name, gender = '미지정') {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      throw new Error('학생 이름을 입력해주세요.');
    }

    const cleanNum = parseInt(number, 10) || (this.students.length + 1);

    const newStudent = {
      id: std__,
      number: cleanNum,
      name: cleanName,
      gender: ['남', '여'].includes(gender) ? gender : '미지정'
    };

    this.students.push(newStudent);
    this.sortStudents();
    return newStudent;
  }

  /**
   * Updates an existing student
   */
  updateStudent(id, number, name, gender) {
    const student = this.students.find(s => s.id === id);
    if (!student) return false;

    if (name && name.trim()) student.name = name.trim();
    if (number) student.number = parseInt(number, 10) || student.number;
    if (gender) student.gender = ['남', '여'].includes(gender) ? gender : '미지정';

    this.sortStudents();
    return true;
  }

  /**
   * Deletes a student
   */
  deleteStudent(id) {
    this.students = this.students.filter(s => s.id !== id);
  }

  /**
   * Clears all students
   */
  clearAll() {
    this.students = [];
  }

  /**
   * Sorts student list by number
   */
  sortStudents() {
    this.students.sort((a, b) => a.number - b.number);
  }

  /**
   * Find student by ID
   */
  getById(id) {
    return this.students.find(s => s.id === id);
  }

  /**
   * Parses Excel / CSV files using SheetJS
   */
  async parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      if (typeof XLSX === 'undefined') {
        reject(new Error('엑셀 파싱 라이브러리(SheetJS)가 로드되지 않았습니다.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (!jsonRows || jsonRows.length === 0) {
            reject(new Error('엑셀 파일에 데이터가 없습니다.'));
            return;
          }

          // Detect columns
          let headerRowIndex = 0;
          let numCol = -1;
          let nameCol = -1;
          let genderCol = -1;

          for (let r = 0; r < Math.min(5, jsonRows.length); r++) {
            const row = jsonRows[r];
            for (let c = 0; c < row.length; c++) {
              const cellStr = String(row[c]).trim().toLowerCase();
              if (['번호', 'num', 'no', 'number'].includes(cellStr)) numCol = c;
              if (['이름', '성명', 'name', '학생이름', '학생'].includes(cellStr)) nameCol = c;
              if (['성별', 'gender', 'sex'].includes(cellStr)) genderCol = c;
            }
            if (nameCol !== -1) {
              headerRowIndex = r;
              break;
            }
          }

          if (nameCol === -1) {
            numCol = 0;
            nameCol = 1;
            genderCol = 2;
            headerRowIndex = -1;
          }

          const parsedStudents = [];
          for (let r = headerRowIndex + 1; r < jsonRows.length; r++) {
            const row = jsonRows[r];
            if (!row || row.length === 0) continue;

            const rawName = nameCol !== -1 && row[nameCol] !== undefined ? String(row[nameCol]).trim() : '';
            if (!rawName) continue;

            let rawNum = numCol !== -1 && row[numCol] !== undefined ? parseInt(row[numCol], 10) : NaN;
            if (isNaN(rawNum)) rawNum = parsedStudents.length + 1;

            let rawGender = '미지정';
            if (genderCol !== -1 && row[genderCol] !== undefined) {
              const gStr = String(row[genderCol]).trim();
              if (['남', '남학생', '남자', 'm', 'male'].includes(gStr.toLowerCase())) rawGender = '남';
              else if (['여', '여학생', '여자', 'f', 'female'].includes(gStr.toLowerCase())) rawGender = '여';
            }

            parsedStudents.push({
              id: std__,
              number: rawNum,
              name: rawName,
              gender: rawGender
            });
          }

          if (parsedStudents.length === 0) {
            reject(new Error('엑셀에서 유효한 학생 명단을 찾을 수 없습니다. (이름 열 확인 필요)'));
            return;
          }

          this.students = parsedStudents;
          this.sortStudents();
          resolve(this.students);
        } catch (err) {
          reject(new Error(엑셀 파일 처리 중 오류가 발생했습니다: ));
        }
      };

      reader.onerror = () => reject(new Error('파일을 읽는 도중 오류가 발생했습니다.'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Generates and triggers download of sample Excel template
   */
  downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      alert('엑셀 생성 라이브러리를 불러오는 중입니다.');
      return;
    }

    const templateData = [
      ['번호', '이름', '성별'],
      [1, '김민수', '남'],
      [2, '이서연', '여'],
      [3, '박지훈', '남']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 10 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '학생명단');

    XLSX.writeFile(wb, '학생명단_업로드양식.xlsx');
  }

  toJSON() {
    return this.students;
  }

  fromJSON(data) {
    if (Array.isArray(data)) {
      this.students = data;
      this.sortStudents();
    }
  }
}
