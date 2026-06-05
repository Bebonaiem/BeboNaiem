// ===== التطبيق الرئيسي =====

// عناصر DOM
const pages = {
    home: document.getElementById('home-page'),
    quiz: document.getElementById('quiz-page'),
    result: document.getElementById('result-page'),
    attempts: document.getElementById('attempts-page'),
    attemptDetail: document.getElementById('attempt-detail-page')
};

// حالة التطبيق
let state = {
    currentQuestions: [],
    currentIndex: 0,
    answers: {},
    isRandom: false,
    attemptNumber: 1,
    startTime: null
};

// ===== إدارة الصفحات =====
function showPage(pageName) {
    Object.values(pages).forEach(page => page.classList.remove('active'));
    pages[pageName].classList.add('active');
    window.scrollTo(0, 0);
}

// ===== ترتيب عشوائي =====
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ===== بدء الاختبار =====
function startQuiz(random = false) {
    state.isRandom = random;
    state.currentIndex = 0;
    state.answers = {};
    state.startTime = Date.now();
    
    // ترتيب الأسئلة
    if (random) {
        state.currentQuestions = shuffleArray(questions);
    } else {
        state.currentQuestions = [...questions];
    }
    
    // تحديد رقم المحاولة
    const attempts = getAttempts();
    state.attemptNumber = attempts.length + 1;
    
    // حفظ معلومات المحاولة الحالية
    localStorage.setItem('currentQuiz', JSON.stringify({
        questions: state.currentQuestions,
        attemptNumber: state.attemptNumber,
        startTime: state.startTime
    }));
    
    showPage('quiz');
    renderQuestion();
}

// ===== عرض السؤال الحالي =====
function renderQuestion() {
    const question = state.currentQuestions[state.currentIndex];
    const total = state.currentQuestions.length;
    
    // تحديث العداد
    document.getElementById('question-counter').textContent = `السؤال ${state.currentIndex + 1} من ${total}`;
    document.getElementById('attempt-label').textContent = `المحاولة ${state.attemptNumber}`;
    
    // تحديث شريط التقدم
    const progress = ((state.currentIndex + 1) / total) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    
    // عرض السؤال
    document.getElementById('question-text').textContent = question.question;
    
    // عرض الخيارات
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    if (question.type === 'tf') {
        // أسئلة صح/خطأ
        const trueBtn = createOptionButton('صح', true, question.id);
        const falseBtn = createOptionButton('خطأ', false, question.id);
        optionsContainer.appendChild(trueBtn);
        optionsContainer.appendChild(falseBtn);
    } else {
        // أسئلة اختيار من متعدد
        const labels = ['أ', 'ب', 'ج', 'د'];
        question.options.forEach((option, index) => {
            const btn = createOptionButton(`${labels[index]}) ${option}`, index, question.id);
            optionsContainer.appendChild(btn);
        });
    }
    
    // تحديث حالة الأزرار
    updateNavButtons();
}

// ===== إنشاء زرار خيار =====
function createOptionButton(text, value, questionId) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    
    // استخراج الحرف من النص
    const labelMatch = text.match(/^([أبجد])\)/);
    if (labelMatch) {
        const spanLabel = document.createElement('span');
        spanLabel.className = 'option-label';
        spanLabel.textContent = labelMatch[1];
        btn.appendChild(spanLabel);
        
        const spanText = document.createElement('span');
        spanText.textContent = text.replace(/^[أبجد]\)\s*/, '');
        btn.appendChild(spanText);
    } else {
        // للأسئلة true/false
        const spanLabel = document.createElement('span');
        spanLabel.className = 'option-label';
        spanLabel.textContent = text === 'صح' ? '✓' : '✗';
        btn.appendChild(spanLabel);
        
        const spanText = document.createElement('span');
        spanText.textContent = text;
        btn.appendChild(spanText);
    }
    
    // تحديد إذا كان محدداً مسبقاً
    if (state.answers[questionId] !== undefined) {
        if (question.type === 'tf') {
            if (state.answers[questionId] === value) {
                btn.classList.add('selected');
            }
        } else {
            if (state.answers[questionId] === value) {
                btn.classList.add('selected');
            }
        }
    }
    
    btn.addEventListener('click', () => selectAnswer(questionId, value));
    return btn;
}

// ===== تحديد الإجابة =====
function selectAnswer(questionId, value) {
    state.answers[questionId] = value;
    
    // حفظ التقدم
    saveProgress();
    
    // تحديث عرض الخيارات
    const question = questions.find(q => q.id === questionId);
    const optionsContainer = document.getElementById('options-container');
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    if (question.type === 'tf') {
        const index = value ? 0 : 1;
        buttons[index].classList.add('selected');
    } else {
        buttons[value].classList.add('selected');
    }
}

// ===== تحديث أزرار التنقل =====
function updateNavButtons() {
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    
    prevBtn.disabled = state.currentIndex === 0;
    
    if (state.currentIndex === state.currentQuestions.length - 1) {
        nextBtn.textContent = 'إنهاء';
    } else {
        nextBtn.textContent = 'التالي';
    }
}

// ===== الانتقال للسؤال السابق =====
function prevQuestion() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        renderQuestion();
    }
}

// ===== الانتقال للسؤال التالي / إنهاء الاختبار =====
function nextQuestion() {
    if (state.currentIndex < state.currentQuestions.length - 1) {
        state.currentIndex++;
        renderQuestion();
    } else {
        endQuiz();
    }
}

// ===== إنهاء الاختبار =====
function endQuiz() {
    // حساب النتيجة
    const results = calculateResults();
    
    // حفظ المحاولة
    saveAttempt(results);
    
    // مسح التقدم الحالي
    localStorage.removeItem('currentQuiz');
    
    // عرض صفحة النتائج
    showResults(results);
}

// ===== حساب النتائج =====
function calculateResults() {
    let correct = 0;
    let wrong = 0;
    const details = [];
    
    state.currentQuestions.forEach(question => {
        const userAnswer = state.answers[question.id];
        let isCorrect = false;
        
        if (question.type === 'tf') {
            isCorrect = userAnswer === question.answer;
        } else {
            isCorrect = userAnswer === question.answer;
        }
        
        if (isCorrect) {
            correct++;
        } else {
            wrong++;
        }
        
        details.push({
            question: question,
            userAnswer: userAnswer,
            isCorrect: isCorrect
        });
    });
    
    return {
        correct,
        wrong,
        total: state.currentQuestions.length,
        percentage: Math.round((correct / state.currentQuestions.length) * 100),
        details,
        attemptNumber: state.attemptNumber,
        date: new Date().toLocaleString('ar-EG'),
        isRandom: state.isRandom
    };
}

// ===== عرض صفحة النتائج =====
function showResults(results) {
    showPage('result');
    
    // ملخص النتائج
    const summaryHtml = `
        <div class="summary-box correct">
            <span class="number">${results.correct}</span>
            <span class="label">صحيح</span>
        </div>
        <div class="summary-box wrong">
            <span class="number">${results.wrong}</span>
            <span class="label">خطأ</span>
        </div>
        <div class="summary-box total">
            <span class="number">${results.percentage}%</span>
            <span class="label">النسبة</span>
        </div>
    `;
    document.getElementById('result-summary').innerHTML = summaryHtml;
    
    // تفاصيل الإجابات
    let detailsHtml = '';
    results.details.forEach((item, index) => {
        const correctAnswer = item.question.type === 'tf' 
            ? (item.question.answer ? 'صح' : 'خطأ')
            : `${['أ', 'ب', 'ج', 'د'][item.question.answer]}) ${item.question.options[item.question.answer]}`;
        
        let userAnswerText = 'لم يجب';
        if (item.userAnswer !== undefined) {
            if (item.question.type === 'tf') {
                userAnswerText = item.userAnswer ? 'صح' : 'خطأ';
            } else {
                userAnswerText = `${['أ', 'ب', 'ج', 'د'][item.userAnswer]}) ${item.question.options[item.userAnswer]}`;
            }
        }
        
        detailsHtml += `
            <div class="result-item ${item.isCorrect ? 'correct' : 'wrong'}">
                <div class="q-number">السؤال ${index + 1} - ${item.question.section}</div>
                <div class="q-text">${item.question.question}</div>
                <div class="q-answer user-answer">إجابتك: ${userAnswerText}</div>
                ${!item.isCorrect ? `<div class="q-answer correct-answer">الإجابة الصحيحة: ${correctAnswer}</div>` : ''}
            </div>
        `;
    });
    
    document.getElementById('result-details').innerHTML = detailsHtml;
}

// ===== حفظ المحاولة =====
function saveAttempt(results) {
    const attempts = getAttempts();
    attempts.push({
        attemptNumber: results.attemptNumber,
        date: results.date,
        correct: results.correct,
        wrong: results.wrong,
        total: results.total,
        percentage: results.percentage,
        isRandom: results.isRandom,
        questions: state.currentQuestions.map(q => q.id),
        answers: { ...state.answers }
    });
    localStorage.setItem('quizAttempts', JSON.stringify(attempts));
}

// ===== جلب المحاولات =====
function getAttempts() {
    const data = localStorage.getItem('quizAttempts');
    return data ? JSON.parse(data) : [];
}

// ===== عرض صفحة المحاولات =====
function showAttempts() {
    showPage('attempts');
    const attempts = getAttempts();
    const container = document.getElementById('attempts-list');
    
    if (attempts.length === 0) {
        container.innerHTML = '<div class="no-attempts">لا توجد محاولات سابقة</div>';
        return;
    }
    
    let html = '';
    attempts.reverse().forEach(attempt => {
        html += `
            <div class="attempt-item" onclick="showAttemptDetail(${attempt.attemptNumber})">
                <div class="attempt-header">
                    <span class="attempt-number">المحاولة ${attempt.attemptNumber}</span>
                    <span class="attempt-date">${attempt.date}</span>
                </div>
                <div class="attempt-stats">
                    <span class="stat-correct">✓ ${attempt.correct} صحيح</span>
                    <span class="stat-wrong">✗ ${attempt.wrong} خطأ</span>
                </div>
                <div class="attempt-score">النسبة: ${attempt.percentage}% ${attempt.isRandom ? '(ترتيب عشوائي)' : ''}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ===== عرض تفاصيل محاولة محددة =====
function showAttemptDetail(attemptNumber) {
    const attempts = getAttempts();
    const attempt = attempts.find(a => a.attemptNumber === attemptNumber);
    
    if (!attempt) return;
    
    showPage('attemptDetail');
    
    document.getElementById('attempt-detail-title').textContent = `تفاصيل المحاولة ${attemptNumber}`;
    
    // ملخص
    const summaryHtml = `
        <div class="summary-box correct">
            <span class="number">${attempt.correct}</span>
            <span class="label">صحيح</span>
        </div>
        <div class="summary-box wrong">
            <span class="number">${attempt.wrong}</span>
            <span class="label">خطأ</span>
        </div>
        <div class="summary-box total">
            <span class="number">${attempt.percentage}%</span>
            <span class="label">النسبة</span>
        </div>
    `;
    document.getElementById('attempt-detail-summary').innerHTML = summaryHtml;
    
    // تفاصيل الإجابات
    let detailsHtml = '';
    attempt.questions.forEach((qId, index) => {
        const question = questions.find(q => q.id === qId);
        const userAnswer = attempt.answers[qId];
        
        let isCorrect = false;
        if (question.type === 'tf') {
            isCorrect = userAnswer === question.answer;
        } else {
            isCorrect = userAnswer === question.answer;
        }
        
        const correctAnswer = question.type === 'tf' 
            ? (question.answer ? 'صح' : 'خطأ')
            : `${['أ', 'ب', 'ج', 'د'][question.answer]}) ${question.options[question.answer]}`;
        
        let userAnswerText = 'لم يجب';
        if (userAnswer !== undefined) {
            if (question.type === 'tf') {
                userAnswerText = userAnswer ? 'صح' : 'خطأ';
            } else {
                userAnswerText = `${['أ', 'ب', 'ج', 'د'][userAnswer]}) ${question.options[userAnswer]}`;
            }
        }
        
        detailsHtml += `
            <div class="result-item ${isCorrect ? 'correct' : 'wrong'}">
                <div class="q-number">السؤال ${index + 1} - ${question.section}</div>
                <div class="q-text">${question.question}</div>
                <div class="q-answer user-answer">إجابتك: ${userAnswerText}</div>
                ${!isCorrect ? `<div class="q-answer correct-answer">الإجابة الصحيحة: ${correctAnswer}</div>` : ''}
            </div>
        `;
    });
    
    document.getElementById('attempt-detail-details').innerHTML = detailsHtml;
}

// ===== حفظ التقدم =====
function saveProgress() {
    localStorage.setItem('currentQuiz', JSON.stringify({
        questions: state.currentQuestions,
        currentIndex: state.currentIndex,
        answers: state.answers,
        attemptNumber: state.attemptNumber,
        startTime: state.startTime
    }));
}

// ===== استعادة التقدم =====
function restoreProgress() {
    const data = localStorage.getItem('currentQuiz');
    if (data) {
        const saved = JSON.parse(data);
        state.currentQuestions = saved.questions;
        state.currentIndex = saved.currentIndex || 0;
        state.answers = saved.answers || {};
        state.attemptNumber = saved.attemptNumber;
        state.startTime = saved.startTime;
        return true;
    }
    return false;
}

// ===== تهيئة التطبيق =====
function init() {
    // أزرار الصفحة الرئيسية
    document.getElementById('btn-start').addEventListener('click', () => startQuiz(false));
    document.getElementById('btn-random').addEventListener('click', () => startQuiz(true));
    document.getElementById('btn-attempts').addEventListener('click', showAttempts);
    
    // أزرار التنقل في الاختبار
    document.getElementById('btn-prev').addEventListener('click', prevQuestion);
    document.getElementById('btn-next').addEventListener('click', nextQuestion);
    document.getElementById('btn-end').addEventListener('click', endQuiz);
    
    // أزرار العودة
    document.getElementById('btn-back-home').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-back-home2').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-back-home3').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-back-attempts').addEventListener('click', showAttempts);
    
    // التحقق من وجود تقدم محفوظ
    if (restoreProgress()) {
        // عرض زرار للاستمرار
        showPage('home');
        const homeCard = document.querySelector('.home-card');
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn-primary';
        continueBtn.id = 'btn-continue';
        continueBtn.textContent = 'استمرار في الاختبار';
        continueBtn.style.background = 'linear-gradient(135deg, #28a745, #218838)';
        continueBtn.addEventListener('click', () => {
            showPage('quiz');
            renderQuestion();
        });
        
        // إضافة الزرار بعد الأزرار الموجودة
        const buttonsDiv = homeCard.querySelector('.buttons');
        buttonsDiv.insertBefore(continueBtn, buttonsDiv.firstChild);
    }
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', init);
