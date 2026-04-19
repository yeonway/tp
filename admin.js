// 관리자 페이지 전용 JavaScript
class AdminManager {
    constructor() {
        this.assignments = [];
        this.init();
    }

    async init() {
        await this.loadAllAssignments();
        this.renderAssignments();
    }

    // 모든 수행평가 로드
    async loadAllAssignments() {
        try {
            const response = await fetch('/api/assignments');
            this.assignments = await response.json();
        } catch (error) {
            console.error('수행평가 로드 중 오류:', error);
            alert('수행평가를 불러오는 중 오류가 발생했습니다.');
        }
    }

    // 수행평가 목록 렌더링
    renderAssignments() {
        const container = document.getElementById('allAssignments');
        
        if (this.assignments.length === 0) {
            container.innerHTML = '<p>등록된 수행평가가 없습니다.</p>';
            return;
        }

        container.innerHTML = this.assignments.map(assignment => `
            <div class="assignment-item">
                <div class="assignment-info">
                    <h3>${assignment.title}</h3>
                    <p><strong>날짜:</strong> ${assignment.date}</p>
                    <p><strong>교시:</strong> ${assignment.period}교시</p>
                    <p><strong>과목:</strong> ${assignment.subject}</p>
                    <p><strong>설명:</strong> ${assignment.description || '없음'}</p>
                    <p><strong>등록일:</strong> ${new Date(assignment.createdAt).toLocaleString()}</p>
                </div>
                <div class="assignment-actions">
                    <button class="delete-btn" onclick="adminManager.deleteAssignment('${assignment._id}')">
                        삭제
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 수행평가 삭제 (확인 없이 바로 실행)
    async deleteAssignment(id) {
        try {
            const response = await fetch(`/api/assignments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // 성공적으로 삭제되면 목록에서 제거
                this.assignments = this.assignments.filter(a => a._id !== id);
                this.renderAssignments();
                console.log('수행평가가 삭제되었습니다.');
            } else {
                throw new Error('삭제 실패');
            }
        } catch (error) {
            console.error('삭제 중 오류:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    }

    // 모든 수행평가 일괄 삭제
    async deleteAllAssignments() {
        try {
            const deletePromises = this.assignments.map(assignment => 
                fetch(`/api/assignments/${assignment._id}`, { method: 'DELETE' })
            );
            
            await Promise.all(deletePromises);
            this.assignments = [];
            this.renderAssignments();
            console.log('모든 수행평가가 삭제되었습니다.');
        } catch (error) {
            console.error('일괄 삭제 중 오류:', error);
            alert('일괄 삭제 중 오류가 발생했습니다.');
        }
    }
}

// 전역 관리자 객체 생성
const adminManager = new AdminManager();

// 관리자 기능 단축키
document.addEventListener('keydown', (e) => {
    // Ctrl + Alt + D: 모든 수행평가 삭제
    if (e.ctrlKey && e.altKey && e.key === 'D') {
        adminManager.deleteAllAssignments();
    }
    
    // Ctrl + Alt + R: 목록 새로고침
    if (e.ctrlKey && e.altKey && e.key === 'R') {
        adminManager.init();
    }
});