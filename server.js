const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// node-fetch v3는 Promise로 import해야 함
let fetch;

async function initFetch() {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default;
}

initFetch();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/schoolTimetable', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 스키마 정의
const assignmentSchema = new mongoose.Schema({
  date: String,
  period: Number,
  subject: String,
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

// 컴시간 API를 사용한 시간표 파싱
class ComciganParser {
  constructor() {
    this.baseUrl = 'https://comcigan.com/api'; // 실제 컴시간 API 엔드포인트
  }

  async searchSchool(schoolName) {
    try {
      // 실제 컴시간 API는 더 복잡하지만 예시로 간단한 구조
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(schoolName)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('학교 검색 중 오류:', error);
      return [];
    }
  }

  async getTimetable(schoolCode, grade, classNum) {
    try {
      const params = new URLSearchParams({
        school: schoolCode,
        grade: grade,
        class: classNum
      });

      const response = await fetch(`${this.baseUrl}/timetable?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.parseTimetableData(data);
    } catch (error) {
      console.error('시간표 가져오기 중 오류:', error);
      // 에러 발생시 샘플 데이터 반환
      return this.getSampleTimetable();
    }
  }

  parseTimetableData(rawData) {
    const timetable = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };

    // 실제 데이터 구조에 따라 파싱 로직 구현
    if (rawData && rawData.timetable) {
      Object.keys(timetable).forEach((day, index) => {
        const dayIndex = index + 1; // 1: 월요일, 2: 화요일, ...
        if (rawData.timetable[dayIndex]) {
          timetable[day] = rawData.timetable[dayIndex].map(period => ({
            period: period.period,
            subject: period.subject,
            teacher: period.teacher,
            classroom: period.classroom
          }));
        }
      });
    }

    return timetable;
  }

  getSampleTimetable() {
    return {
      Monday: [
        {period: 1, subject: "국어", teacher: "김선생"},
        {period: 2, subject: "수학", teacher: "이선생"},
        {period: 3, subject: "영어", teacher: "박선생"},
        {period: 4, subject: "과학", teacher: "최선생"},
        {period: 5, subject: "사회", teacher: "정선생"},
        {period: 6, subject: "체육", teacher: "강선생"},
        {period: 7, subject: "자율", teacher: "담임"}
      ],
      Tuesday: [
        {period: 1, subject: "수학", teacher: "이선생"},
        {period: 2, subject: "국어", teacher: "김선생"},
        {period: 3, subject: "사회", teacher: "정선생"},
        {period: 4, subject: "과학", teacher: "최선생"},
        {period: 5, subject: "영어", teacher: "박선생"},
        {period: 6, subject: "음악", teacher: "윤선생"},
        {period: 7, subject: "자율", teacher: "담임"}
      ],
      Wednesday: [
        {period: 1, subject: "영어", teacher: "박선생"},
        {period: 2, subject: "과학", teacher: "최선생"},
        {period: 3, subject: "국어", teacher: "김선생"},
        {period: 4, subject: "수학", teacher: "이선생"},
        {period: 5, subject: "체육", teacher: "강선생"},
        {period: 6, subject: "사회", teacher: "정선생"},
        {period: 7, subject: "자율", teacher: "담임"}
      ],
      Thursday: [
        {period: 1, subject: "사회", teacher: "정선생"},
        {period: 2, subject: "과학", teacher: "최선생"},
        {period: 3, subject: "영어", teacher: "박선생"},
        {period: 4, subject: "국어", teacher: "김선생"},
        {period: 5, subject: "수학", teacher: "이선생"},
        {period: 6, subject: "미술", teacher: "한선생"},
        {period: 7, subject: "자율", teacher: "담임"}
      ],
      Friday: [
        {period: 1, subject: "자율", teacher: "담임"},
        {period: 2, subject: "자율", teacher: "담임"},
        {period: 3, subject: "자율", teacher: "담임"},
        {period: 4, subject: "자율", teacher: "담임"},
        {period: 5, subject: "종례", teacher: "담임"},
        {period: 6, subject: "동아리", teacher: "담당교사"},
        {period: 7, subject: "동아리", teacher: "담당교사"}
      ]
    };
  }
}

// 라우트 정의
// 수행평가 관련 API
app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ date: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 시간표 관련 API
const parser = new ComciganParser();

app.get('/api/timetable/search/:schoolName', async (req, res) => {
  try {
    const schools = await parser.searchSchool(req.params.schoolName);
    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/timetable/:schoolCode/:grade/:class', async (req, res) => {
  try {
    const timetable = await parser.getTimetable(
      req.params.schoolCode,
      parseInt(req.params.grade),
      parseInt(req.params.class)
    );
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 정적 파일 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});