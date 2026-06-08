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
    startTime: null,
    lastResults: null
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
    
    // جلب عدد الأسئلة المحدد
    const questionCount = parseInt(document.getElementById('question-count').value);
    
    // ترتيب الأسئلة واختيار العدد المطلوب
    let selectedQuestions;
    if (random) {
        selectedQuestions = shuffleArray(questions);
    } else {
        selectedQuestions = [...questions];
    }
    
    // تحديد عدد الأسئلة
    state.currentQuestions = selectedQuestions.slice(0, questionCount);
    
    // تحديد رقم المحاولة
    const attempts = getAttempts();
    state.attemptNumber = attempts.length + 1;
    
    // حفظ معلومات المحاولة الحالية
    localStorage.setItem('currentQuiz', JSON.stringify({
        questionIds: state.currentQuestions.map(q => q.id),
        attemptNumber: state.attemptNumber,
        startTime: state.startTime,
        isRandom: state.isRandom
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
    
    // عرض السؤال مع الترقيم
    document.getElementById('question-text').textContent = `${state.currentIndex + 1}. ${question.question}`;
    
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
    if (state.answers[questionId] === value) {
        btn.classList.add('selected');
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
    nextBtn.disabled = state.currentIndex === state.currentQuestions.length - 1;
}

// ===== الانتقال للسؤال السابق =====
function prevQuestion() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        renderQuestion();
    }
}

// ===== الانتقال للسؤال التالي =====
function nextQuestion() {
    if (state.currentIndex < state.currentQuestions.length - 1) {
        state.currentIndex++;
        renderQuestion();
    }
}

// ===== إنهاء الاختبار =====
function endQuiz() {
    // حساب عدد الأسئلة التي تم الإجابة عليها
    const answered = state.currentQuestions.filter(q => state.answers[q.id] !== undefined).length;
    const total = state.currentQuestions.length;
    const unanswered = total - answered;
    
    // رسالة تأكيد
    let message = 'هل أنت متأكد من إنهاء الاختبار؟';
    if (unanswered > 0) {
        message = `لديك ${unanswered} سؤال لم تتم الإجابة عليه بعد.\nهل أنت متأكد من إنهاء الاختبار؟`;
    }
    
    showConfirmModal(message, () => {
        // حساب النتيجة
        const results = calculateResults();
        
        // حفظ المحاولة
        saveAttempt(results);
        
        // مسح التقدم الحالي
        localStorage.removeItem('currentQuiz');
        
        // عرض صفحة النتائج
        showResults(results);
    });
}

// ===== مودال التأكيد =====
let confirmCallback = null;

function showConfirmModal(message, onConfirm) {
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-modal').classList.add('active');
    confirmCallback = onConfirm;
}

function hideConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('active');
    confirmCallback = null;
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
                ${!item.isCorrect && item.question.correction ? `<div class="q-correction">التصحيح: ${item.question.correction}</div>` : ''}
            </div>
        `;
    });
    
    document.getElementById('result-details').innerHTML = detailsHtml;
    
    // حفظ النتائج للمشاركة
    state.lastResults = results;
}

// ===== مشاركة النتيجة =====
function shareWhatsApp() {
    const r = state.lastResults;
    if (!r) return;
    
    const text = encodeURIComponent(
        `اختبار تطبيقات العروض التعليمية\n` +
        `النتيجة: ${r.correct} صحيح / ${r.wrong} خطأ\n` +
        `النسبة: ${r.percentage}%\n` +
        `عدد الأسئلة: ${r.total}\n\n` +
        `جرب الاختبار بنفسك!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
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
        // تحويل المفتاح من string إلى number للتوافق
        const userAnswer = attempt.answers[qId] !== undefined ? attempt.answers[qId] : attempt.answers[String(qId)];
        
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
                ${!isCorrect && question.correction ? `<div class="q-correction">التصحيح: ${question.correction}</div>` : ''}
            </div>
        `;
    });
    
    document.getElementById('attempt-detail-details').innerHTML = detailsHtml;
}

// ===== حفظ التقدم =====
function saveProgress() {
    // حفظ فقط IDs الأسئلة بدل الكائنات الكاملة
    const questionIds = state.currentQuestions.map(q => q.id);
    localStorage.setItem('currentQuiz', JSON.stringify({
        questionIds: questionIds,
        currentIndex: state.currentIndex,
        answers: state.answers,
        attemptNumber: state.attemptNumber,
        startTime: state.startTime,
        isRandom: state.isRandom
    }));
}

// ===== استعادة التقدم =====
function restoreProgress() {
    const data = localStorage.getItem('currentQuiz');
    if (!data) return false;
    
    try {
        const saved = JSON.parse(data);
        
        // التحقق من صحة البيانات
        if (!saved.questionIds || !Array.isArray(saved.questionIds)) return false;
        
        // استعادة الأسئلة من المصفوفة الأصلية باستخدام IDs
        state.currentQuestions = saved.questionIds
            .map(id => questions.find(q => q.id === id))
            .filter(q => q !== undefined);
        
        // إذا لم يتم استعادة أي أسئلة، اعتبر التقدم غير صالح
        if (state.currentQuestions.length === 0) return false;
        
        state.currentIndex = saved.currentIndex || 0;
        
        // تحويل مفاتيح الإجابات من string إلى number
        state.answers = {};
        if (saved.answers && typeof saved.answers === 'object') {
            Object.keys(saved.answers).forEach(key => {
                state.answers[Number(key)] = saved.answers[key];
            });
        }
        
        state.attemptNumber = saved.attemptNumber || 1;
        state.startTime = saved.startTime || Date.now();
        state.isRandom = saved.isRandom || false;
        
        // التأكد من أن currentIndex لا يتجاوز عدد الأسئلة
        if (state.currentIndex >= state.currentQuestions.length) {
            state.currentIndex = state.currentQuestions.length - 1;
        }
        
        return true;
    } catch (e) {
        console.error('Error restoring progress:', e);
        return false;
    }
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
    document.getElementById('btn-back-home4').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-back-home5').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-back-attempts').addEventListener('click', showAttempts);
    document.getElementById('btn-back-attempts2').addEventListener('click', showAttempts);
    
    // أزرار المشاركة
    document.getElementById('btn-share-whatsapp').addEventListener('click', shareWhatsApp);
    document.getElementById('btn-share-whatsapp2').addEventListener('click', shareWhatsApp);
    
    // أزرار المودال
    document.getElementById('confirm-ok').addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        hideConfirmModal();
    });
    document.getElementById('confirm-cancel').addEventListener('click', hideConfirmModal);
    
    // التحقق من وجود تقدم محفوظ
    if (restoreProgress()) {
        // العودة مباشرة للاختبار
        showPage('quiz');
        renderQuestion();
    }
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', init);
