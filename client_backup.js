// 전역 변수
let currentDate = new Date();
let events = [];
let isAdminMode = false;
let classTimetable = null;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadAssignments();
    await loadTimetable();
    renderCalendar();
    setupEventListeners();
});

// MongoDB에서 수행평가 로드
async function loadAssignments() {
    try {
        const response = await fetch('/api/assignments');
        events = await response.json();
    } catch (error) {
        console.error('수행평가 로드 중 오류:', error);
        alert('수행평가를 불러오는 중 오류가 발생했습니다.');
    }
}

// 컴시간 API에서 시간표 로드
async function loadTimetable() {
    try {
        // 실제 학교 코드, 학년, 반으로 변경해야 합니다.
        const schoolCode = 'SAMPLE_CODE'; // 실제 학교 코드
        const grade = 2;  // 2학년
        const classNum = 5; // 5반
        
        const response = await fetch(`/api/timetable/${schoolCode}/${grade}/${classNum}`);
        classTimetable = await response.json();
    } catch (error) {
        console.error('시간표 로드 중 오류:', error);
        // 에러 발생시 샘플 시간표 사용
        classTimetable = {
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

// 이벤트 리스너 설정
function setupEventListeners() {
    // 달력 네비게이션
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // 관리자 모드 토글
    document.getElementById('adminToggle').addEventListener('click', toggleAdminMode);
    
    // 이벤트 폼 제출
    document.getElementById('eventForm').addEventListener('submit', addEvent);
    
    // 닫기 버튼들
    document.getElementById('closeEvent').addEventListener('click', () => {
        document.getElementById('eventDetail').style.display = 'none';
    });
    
    document.getElementById('cancelAdd').addEventListener('click', () => {
        document.getElementById('addEventForm').style.display = 'none';
    });
}

// 관리자 모드 토글
function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    const adminBtn = document.getElementById('adminToggle');
    
    if (isAdminMode) {
        adminBtn.textContent = '관리자 모드 ON';
        adminBtn.style.background = 'rgba(255,255,255,0.8)';
        adminBtn.style.color = '#667eea';
    } else {
        adminBtn.textContent = '관리자 모드';
        adminBtn.style.background = 'rgba(255,255,255,0.2)';
        adminBtn.style.color = 'white';
    }
    
    renderCalendar();
}

// 달력 렌더링
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 현재 월 표시 업데이트
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월',
                       '7월', '8월', '9월', '10월', '11월', '12월'];
    document.getElementById('currentMonth').textContent = `${year}년 ${monthNames[month]}`;
    
    // 달력 날짜 그리기
    const daysContainer = document.getElementById('calendarDays');
    daysContainer.innerHTML = '';
    
    // 이번 달의 첫 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 지난 달의 마지막 날
    const prevLastDay = new Date(year, month, 0).getDate();
    
    // 이번 달의 첫 날 요일 (0: 일요일, 1: 월요일, ...)
    const firstDayOfWeek = firstDay.getDay();
    
    // 지난 달 날짜들
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayElement = createDayElement(prevLastDay - i, true);
        daysContainer.appendChild(dayElement);
    }
    
    // 이번 달 날짜들
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayElement = createDayElement(i, false);
        daysContainer.appendChild(dayElement);
    }
    
    // 다음 달 날짜들 (달력이 완전히 차도록)
    const totalCells = 42; // 6주 * 7일
    const remainingCells = totalCells - (firstDayOfWeek + lastDay.getDate());
    
    for (let i = 1; i <= remainingCells; i++) {
        const dayElement = createDayElement(i, true);
        daysContainer.appendChild(dayElement);
    }
}

// 날짜 요소 생성
function createDayElement(day, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = `day ${isOtherMonth ? 'other-month' : ''}`;
    
    const date = isOtherMonth ? null : new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date ? formatDate(date) : '';
    
    // 날짜 숫자
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // 해당 날짜의 이벤트들
    if (dateString) {
        const dayEvents = events.filter(event => event.date === dateString);
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events';
        
        // 시간표 정보 표시 (해당 요일의 교시별 정보)
        if (classTimetable) {
            const dayOfWeek = date.getDay(); // 0: 일요일, 1: 월요일, ...
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const timetableDay = dayNames[dayOfWeek];
            
            if (classTimetable[timetableDay]) {
                // 해당 날짜의 수행평가와 시간표 비교
                dayEvents.forEach(event => {
                    const eventBadge = document.createElement('div');
                    eventBadge.className = 'event-badge';
                    
                    // 시간표와 비교하여 충돌 확인
                    const periodInfo = classTimetable[timetableDay].find(p => p.period == event.period);
                    if (periodInfo && periodInfo.subject !== event.subject) {
                        eventBadge.style.background = '#ff6b6b'; // 충돌 시 빨간색
                        eventBadge.title = `${periodInfo.subject} 수업과 충돌!`;
                    }
                    
                    eventBadge.textContent = `${event.period}교시: ${event.subject} - ${event.title}`;
                    eventBadge.onclick = (e) => {
                        e.stopPropagation();
                        showEventDetail(event, periodInfo);
                    };
                    eventsContainer.appendChild(eventBadge);
                });
            }
        } else {
            // 시간표가 없는 경우 기본 이벤트 표시
            dayEvents.forEach(event => {
                const eventBadge = document.createElement('div');
                eventBadge.className = 'event-badge';
                eventBadge.textContent = `${event.period}교시: ${event.subject}`;
                eventBadge.onclick = (e) => {
                    e.stopPropagation();
                    showEventDetail(event);
                };
                eventsContainer.appendChild(eventBadge);
            });
        }
        
        dayElement.appendChild(eventsContainer);
        
        // 관리자 모드에서 클릭하면 새 이벤트 추가
        if (isAdminMode) {
            dayElement.onclick = async () => {
                document.getElementById('eventDate').value = dateString;
                document.getElementById('addEventForm').style.display = 'block';
                document.getElementById('eventDetail').style.display = 'none';
            };
        }
    }
    
    return dayElement;
}

// 날짜 형식화 (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 이벤트 상세 보기 (시간표 정보 포함)
function showEventDetail(event, periodInfo = null) {
    const detailContent = document.getElementById('eventContent');
    
    let conflictInfo = '';
    if (periodInfo && periodInfo.subject !== event.subject) {
        conflictInfo = `
        <div class="event-detail-item" style="color: #ff6b6b; font-weight: bold;">
            ⚠️ 시간표 충돌: ${periodInfo.subject} 수업이 scheduled!
        </div>`;
    }
    
    detailContent.innerHTML = `
        ${conflictInfo}
        <div class="event-detail-item">
            <strong>날짜:</strong> ${event.date}
        </div>
        <div class="event-detail-item">
            <strong>교시:</strong> ${event.period}교시
        </div>
        <div class="event-detail-item">
            <strong>과목:</strong> ${event.subject}
        </div>
        <div class="event-detail-item">
            <strong>제목:</strong> ${event.title}
        </div>
        <div class="event-detail-item">
            <strong>설명:</strong> ${event.description || '없음'}
        </div>
        ${periodInfo ? `
        <div class="event-detail-item">
            <strong>시간표 정보:</strong> ${periodInfo.subject} (${periodInfo.teacher} 선생님)
        </div>
        ` : ''}
    `;
    
    document.getElementById('eventDetail').style.display = 'block';
    document.getElementById('addEventForm').style.display = 'none';
}

// 새 이벤트 추가
async function addEvent(e) {
    e.preventDefault();
    
    const event = {
        date: document.getElementById('eventDate').value,
        period: parseInt(document.getElementById('eventPeriod').value),
        subject: document.getElementById('eventSubject').value,
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value
    };
    
    // 시간표와 충돌 확인
    if (classTimetable) {
        const eventDate = new Date(event.date);
        const dayOfWeek = eventDate.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const timetableDay = dayNames[dayOfWeek];
        
        if (classTimetable[timetableDay]) {
            const periodInfo = classTimetable[timetableDay].find(p => p.period == event.period);
            if (periodInfo && periodInfo.subject !== event.subject) {
                if (!confirm(`${periodInfo.subject} 수업이 있는 ${event.period}교시에 수행평가를 등록하시겠습니까?`)) {
                    return; // 취소 선택시 종료
                }
            }
        }
    }
    
    try {
        // MongoDB에 저장
        const response = await fetch('/api/assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event)
        });
        
        if (response.ok) {
            // 성공적으로 저장되면 로컬에도 추가
            const savedEvent = await response.json();
            events.push(savedEvent);
            
            // 폼 초기화
            document.getElementById('eventForm').reset();
            document.getElementById('addEventForm').style.display = 'none';
            
            // 달력 다시 렌더링
            renderCalendar();
            
            alert('수행평가가 추가되었습니다!');
        } else {
            throw new Error('저장 실패');
        }
    } catch (error) {
        console.error('이벤트 추가 중 오류:', error);
        alert('수행평가 추가 중 오류가 발생했습니다.');
    }
}