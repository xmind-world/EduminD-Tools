/**
 * ============================================
 * XminD IoT Protocol Selector - JavaScript
 * ============================================
 * 
 * A client-side educational tool for helping users choose
 * between MQTT and HTTP for their IoT projects.
 * 
 * Architecture:
 * - Protocol data structures (extensible for future protocols)
 * - Questionnaire state management
 * - Scoring engine
 * - UI rendering functions
 * - Event handlers
 */

(function() {
    'use strict';

    // ============================================
    // PROTOCOL DATA (Extensible Architecture)
    // ============================================
    
    /**
     * Protocol definitions
     * Easy to extend with CoAP, WebSocket, AMQP, LoRaWAN in future versions
     */
    const PROTOCOLS = {
        MQTT: {
            id: 'mqtt',
            name: 'MQTT',
            fullName: 'Message Queuing Telemetry Transport',
            color: '#FF5C17',
            description: 'پروتکل Publish/Subscribe سبک برای IoT',
            strengths: [
                'مدل Publish/Subscribe',
                'مناسب برای چندین مصرف‌کننده',
                'قابلیت توسعه بالا',
                'Event-driven architecture',
                'Many-to-Many communication'
            ],
            weaknesses: [
                'نیاز به Broker',
                'پیچیدگی بیشتر در پیاده‌سازی',
                'نیاز به WebSocket برای مرورگر'
            ],
            useCases: [
                'Real-time monitoring',
                'Sensor networks',
                'Multi-client data distribution',
                'Event-driven systems'
            ]
        },
        HTTP: {
            id: 'http',
            name: 'HTTP',
            fullName: 'Hypertext Transfer Protocol',
            color: '#008C9B',
            description: 'پروتکل Request/Response استاندارد وب',
            strengths: [
                'مدل Request/Response',
                'ساده در پیاده‌سازی',
                'سازگاری بومی با REST API',
                'پشتیبانی کامل در مرورگرها',
                'Stateless architecture'
            ],
            weaknesses: [
                'نامناسب برای Publish/Subscribe',
                'نیاز به Polling برای Real-time',
                'محدود در Many-to-Many'
            ],
            useCases: [
                'Command/Control',
                'Device configuration',
                'One-to-one communication',
                'REST API integration'
            ]
        }
        // Future protocols can be added here:
        // CoAP: { ... },
        // WebSocket: { ... },
        // AMQP: { ... },
        // LoRaWAN: { ... }
    };

    // ============================================
    // QUESTIONNAIRE DATA
    // ============================================
    
    const QUESTIONS = [
        {
            id: 1,
            text: 'چند دستگاه قراره به سیستم متصل بشن؟',
            options: [
                { 
                    text: '1 دستگاه', 
                    scores: { MQTT: 1, HTTP: 3 },
                    reason: null
                },
                { 
                    text: '2 تا 10 دستگاه', 
                    scores: { MQTT: 2, HTTP: 2 },
                    reason: null
                },
                { 
                    text: '10 تا 100 دستگاه', 
                    scores: { MQTT: 3, HTTP: 1 },
                    reason: 'تعداد دستگاه‌ها زیاده'
                },
                { 
                    text: 'بیشتر از 100 دستگاه', 
                    scores: { MQTT: 4, HTTP: 0 },
                    reason: 'تعداد دستگاه‌ها خیلی زیاده'
                }
            ]
        },
        {
            id: 2,
            text: 'داده‌ها چند مصرف‌کننده دارن؟',
            options: [
                { 
                    text: 'فقط یک سرویس', 
                    scores: { MQTT: 1, HTTP: 3 },
                    reason: null
                },
                { 
                    text: 'چند سرویس', 
                    scores: { MQTT: 3, HTTP: 1 },
                    reason: 'چندین مصرف‌کننده برای داده وجود داره'
                },
                { 
                    text: 'تعداد مصرف‌کننده‌ها ممکنه تغییر کنه', 
                    scores: { MQTT: 4, HTTP: 0 },
                    reason: 'مصرف‌کننده‌ها داینامیک هستن'
                }
            ]
        },
        {
            id: 3,
            text: 'مدل ارتباطی موردنیاز چیه؟',
            options: [
                { 
                    text: 'Request / Response', 
                    scores: { MQTT: 0, HTTP: 4 },
                    reason: 'نیاز به مدل Request/Response داری'
                },
                { 
                    text: 'Publish / Subscribe', 
                    scores: { MQTT: 4, HTTP: 0 },
                    reason: 'نیاز به مدل Publish/Subscribe داری'
                },
                { 
                    text: 'هنوز مطمئن نیستم', 
                    scores: { MQTT: 2, HTTP: 2 },
                    reason: null
                }
            ]
        },
        {
            id: 4,
            text: 'دستگاه‌ها باید ارتباط دائمی داشته باشن؟',
            options: [
                { 
                    text: 'بله', 
                    scores: { MQTT: 3, HTTP: 1 },
                    reason: 'ارتباط دائمی مورد نیازه'
                },
                { 
                    text: 'خیر', 
                    scores: { MQTT: 1, HTTP: 3 },
                    reason: null
                },
                { 
                    text: 'بستگی به شرایط داره', 
                    scores: { MQTT: 2, HTTP: 2 },
                    reason: null
                }
            ]
        },
        {
            id: 5,
            text: ' Backend شما REST API داره؟',
            options: [
                { 
                    text: 'بله', 
                    scores: { MQTT: 1, HTTP: 3 },
                    reason: null
                },
                { 
                    text: 'خیر', 
                    scores: { MQTT: 2, HTTP: 1 },
                    reason: null
                },
                { 
                    text: 'هنوز مشخص نیست', 
                    scores: { MQTT: 2, HTTP: 2 },
                    reason: null
                }
            ]
        }
    ];

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    
    const AppState = {
        currentQuestion: 0,
        answers: [],
        scores: {
            MQTT: 0,
            HTTP: 0
        },
        maxScore: 0,
        isComplete: false
    };

    // Calculate maximum possible score
    function calculateMaxScore() {
        let max = 0;
        QUESTIONS.forEach(question => {
            const maxOptionScore = Math.max(
                ...question.options.map(opt => Math.max(opt.scores.MQTT, opt.scores.HTTP))
            );
            max += maxOptionScore;
        });
        return max;
    }

    // ============================================
    // SCORING ENGINE
    // ============================================
    
    /**
     * Calculate scores based on user answers
     * Transparent and easy to modify
     */
    function calculateScores() {
        AppState.scores = { MQTT: 0, HTTP: 0 };
        
        AppState.answers.forEach(answer => {
            if (answer) {
                const question = QUESTIONS.find(q => q.id === answer.questionId);
                const option = question.options.find(opt => opt.text === answer.selectedText);
                
                if (option) {
                    AppState.scores.MQTT += option.scores.MQTT;
                    AppState.scores.HTTP += option.scores.HTTP;
                }
            }
        });
        
        AppState.maxScore = calculateMaxScore();
    }

    /**
     * Generate recommendation based on scores
     */
    function getRecommendation() {
        const totalScore = AppState.scores.MQTT + AppState.scores.HTTP;
        
        if (totalScore === 0) {
            return {
                protocol: 'نامشخص',
                matchPercent: 0,
                reasons: ['نیاز به اطلاعات بیشتر'],
                alternative: 'با جواب دادن به سؤالات بیشتر می‌تونی پیشنهاد دقیق‌تری دریافت کنی.'
            };
        }
        
        const mqttPercent = Math.round((AppState.scores.MQTT / totalScore) * 100);
        const httpPercent = Math.round((AppState.scores.HTTP / totalScore) * 100);
        
        let recommendation;
        let matchPercent;
        let reasons = [];
        let alternative;
        
        if (mqttPercent > httpPercent) {
            recommendation = 'MQTT';
            matchPercent = mqttPercent;
            
            // Collect reasons from answers
            AppState.answers.forEach(answer => {
                const question = QUESTIONS.find(q => q.id === answer.questionId);
                const option = question.options.find(opt => opt.text === answer.selectedText);
                if (option && option.reason && option.scores.MQTT > option.scores.HTTP) {
                    reasons.push(option.reason);
                }
            });
            
            // Add default reasons if not enough specific ones
            if (reasons.length < 2) {
                if (AppState.scores.MQTT > AppState.scores.HTTP * 1.5) {
                    reasons.push('امتیاز MQTT به طور قابل توجهی بالاتره');
                }
                reasons.push('معماری Publish/Subscribe مناسب‌تره');
            }
            
            alternative = 'HTTP هم می‌تونه مناسب باشه اگه نیاز به یکپارچگی ساده با REST API داری یا تعداد مصرف‌کننده‌ها محدوده.';
            
        } else if (httpPercent > mqttPercent) {
            recommendation = 'HTTP';
            matchPercent = httpPercent;
            
            AppState.answers.forEach(answer => {
                const question = QUESTIONS.find(q => q.id === answer.questionId);
                const option = question.options.find(opt => opt.text === answer.selectedText);
                if (option && option.reason && option.scores.HTTP > option.scores.MQTT) {
                    reasons.push(option.reason);
                }
            });
            
            if (reasons.length < 2) {
                if (AppState.scores.HTTP > AppState.scores.MQTT * 1.5) {
                    reasons.push('امتیاز HTTP به طور قابل توجهی بالاتره');
                }
                reasons.push('مدل Request/Response مناسب‌تره');
            }
            
            alternative = 'MQTT هم می‌تونه مناسب باشه اگه در آینده نیاز به اضافه کردن مصرف‌کننده‌های بیشتر داری یا می‌خوای معماری Event-driven داشته باشی.';
            
        } else {
            // Equal scores
            recommendation = 'هر دو';
            matchPercent = 50;
            reasons = [
                'نیازهای پروژه شما با هر دو پروتکل سازگاره',
                'انتخاب نهایی به سایر ملاحظات فنی بستگی داره'
            ];
            alternative = 'در این حالت، توصیه می‌کنیم سایر عوامل مثل زیرساخت موجود، تخصص تیم، و ملاحظات بلندمدت رو در نظر بگیر.';
        }
        
        return {
            protocol: recommendation,
            matchPercent,
            reasons,
            alternative
        };
    }

    // ============================================
    // UI RENDERING FUNCTIONS
    // ============================================
    
    /**
     * Render a question card
     */
    function renderQuestion(index) {
        const container = document.getElementById('questionnaire');
        const question = QUESTIONS[index];
        
        if (!question) return;
        

const isLastQuestion = index === QUESTIONS.length - 1;

const questionHTML = `
    <div class="question-card" role="form" aria-labelledby="question-${question.id}">
        <h3 id="question-${question.id}" class="question-text">${question.text}</h3>
        <div class="options-grid" role="radiogroup" aria-label="گزینه‌های پاسخ">
            ${question.options.map((option, optIndex) => `
                <button 
                    class="option-btn" 
                    data-question-id="${question.id}"
                    data-option-index="${optIndex}"
                    data-option-text="${option.text}"
                    role="radio"
                    aria-checked="false"
                    tabindex="0"
                >
                    ${option.text}
                </button>
            `).join('')}
        </div>
        <div class="navigation-buttons">
            <button 
                class="nav-btn prev" 
                ${index === 0 ? 'disabled' : ''}
                aria-label="سؤال قبلی"
            >
                سؤال قبلی
            </button>
            <button 
                class="nav-btn next" 
                disabled
                aria-label="${isLastQuestion ? 'مشاهده نتیجه' : 'سؤال بعدی'}"
            >
                ${isLastQuestion ? 'مشاهده نتیجه 🎯' : 'سؤال بعدی'}
            </button>
        </div>
    </div>
`;

        container.innerHTML = questionHTML;
        
        // Add event listeners to options
        const optionButtons = container.querySelectorAll('.option-btn');
        optionButtons.forEach(btn => {
            btn.addEventListener('click', handleOptionSelect);
            btn.addEventListener('keydown', handleOptionKeydown);
        });
        
        // Add event listeners to navigation
        const prevBtn = container.querySelector('.prev');
        const nextBtn = container.querySelector('.next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => navigateQuestion(-1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => navigateQuestion(1));
        }
    }

    /**
     * Update progress indicator
     */
    function updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const steps = document.querySelectorAll('.step');
        
        const progress = Math.min(
        ((AppState.currentQuestion + 1) / QUESTIONS.length) * 100, 
        100
        );
        progressFill.style.width = `${progress}%`;
        
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (index < AppState.currentQuestion) {
                step.classList.add('completed');
            } else if (index === AppState.currentQuestion) {
                step.classList.add('active');
            }
        });
    }

    /**
     * Render result card
     */
    function renderResult() {
        calculateScores();
        const recommendation = getRecommendation();
        
        const resultCard = document.getElementById('resultCard');
        const questionnaire = document.querySelector('.questionnaire-container');
        
        // Hide questionnaire, show result
        questionnaire.style.display = 'none';
        resultCard.classList.remove('hidden');
        
        // Populate result data
        document.getElementById('resultProtocol').textContent = recommendation.protocol;
        document.getElementById('matchPercent').textContent = recommendation.matchPercent;
        
        // Update score bars
        const totalScore = AppState.scores.MQTT + AppState.scores.HTTP || 1;
        const mqttPercent = Math.round((AppState.scores.MQTT / totalScore) * 100);
        const httpPercent = Math.round((AppState.scores.HTTP / totalScore) * 100);
        
        document.getElementById('mqttScoreBar').style.width = `${mqttPercent}%`;
        document.getElementById('httpScoreBar').style.width = `${httpPercent}%`;
        document.getElementById('mqttScoreValue').textContent = `${mqttPercent}%`;
        document.getElementById('httpScoreValue').textContent = `${httpPercent}%`;
        
        // Populate reasons
        const reasonsList = document.getElementById('reasonsList');
        reasonsList.innerHTML = recommendation.reasons.map(reason => 
            `<li>${reason}</li>`
        ).join('');
        
        // Populate alternative text
        document.getElementById('alternativeText').textContent = recommendation.alternative;
        
        // Scroll to result
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================
    
    /**
     * Handle option selection
     */
    function handleOptionSelect(event) {
        const selectedBtn = event.target;
        const questionId = parseInt(selectedBtn.dataset.questionId);
        const optionText = selectedBtn.dataset.optionText;
        
        // Visual feedback
        const allOptions = selectedBtn.parentElement.querySelectorAll('.option-btn');
        allOptions.forEach(btn => {
            btn.classList.remove('selected');
            btn.setAttribute('aria-checked', 'false');
        });
        
        selectedBtn.classList.add('selected');
        selectedBtn.setAttribute('aria-checked', 'true');
        
        // Save answer
        const existingAnswerIndex = AppState.answers.findIndex(a => a.questionId === questionId);
        if (existingAnswerIndex >= 0) {
            AppState.answers[existingAnswerIndex] = { questionId, selectedText: optionText };
        } else {
            AppState.answers.push({ questionId, selectedText: optionText });
        }
        
        // Enable next button
        const nextBtn = selectedBtn.closest('.question-card').querySelector('.next');
        if (nextBtn) {
            nextBtn.disabled = false;
        }
    }

    /**
     * Handle keyboard navigation for options
     */
    function handleOptionKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOptionSelect(event);
        }
    }

    /**
     * Navigate between questions
     */
    function navigateQuestion(direction) {
        const newIndex = AppState.currentQuestion + direction;
        
        if (newIndex < 0 || newIndex > QUESTIONS.length) return;
        
        AppState.currentQuestion = newIndex;
        
        if (newIndex === QUESTIONS.length) {
            // Show results
            renderResult();
        } else {
            renderQuestion(newIndex);
            updateProgress();
        }
    }

    /**
     * Restart questionnaire
     */
    function restartQuestionnaire() {
        AppState.currentQuestion = 0;
        AppState.answers = [];
        AppState.scores = { MQTT: 0, HTTP: 0 };
        AppState.isComplete = false;
        
        const resultCard = document.getElementById('resultCard');
        const questionnaire = document.querySelector('.questionnaire-container');
        
        resultCard.classList.add('hidden');
        questionnaire.style.display = 'block';
        
        renderQuestion(0);
        updateProgress();
        
        // Scroll back to questionnaire
        questionnaire.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Smooth scroll to selector section
     */
    function scrollToSelector() {
        const selectorSection = document.getElementById('selector');
        selectorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Toggle comparison table row expansion
     */
    // function toggleTableRow(row) {
    //     const isExpanded = row.classList.contains('expanded');
        
    //     // Close all other rows
    //     // const allRows = document.querySelectorAll('.expandable-row');
    //     // allRows.forEach(r => {
    //     //     r.classList.remove('expanded');
    //     // });

    //         document.querySelectorAll('.expandable-row').forEach(r => {
    //             r.classList.remove('expanded');
    //          });
        
    //     // Toggle current row
    //     if (!isExpanded) {
    //         row.classList.add('expanded');
            
    //         // Show detail (could be implemented with a tooltip or expanded row)
    //         const detail = row.dataset.detail;
    //         if (detail) {
    //             // Create or update detail row
    //             let detailRow = row.nextElementSibling;
    //             if (!detailRow || !detailRow.classList.contains('detail-row')) {
    //                 detailRow = document.createElement('tr');
    //                 detailRow.className = 'detail-row';
    //                 detailRow.innerHTML = `
    //                     <td colspan="3" style="padding: var(--spacing-md); background-color: rgba(0, 140, 155, 0.05); color: var(--xmind-light-blue); line-height: 1.8;">
    //                         ${detail}
    //                     </td>
    //                 `;
    //                 row.parentNode.insertBefore(detailRow, row.nextSibling);
    //             }
    //         }
    //     } else {
    //         // Remove detail row
    //         const detailRow = row.nextElementSibling;
    //         if (detailRow && detailRow.classList.contains('detail-row')) {
    //             detailRow.remove();
    //         }
    //     }
    // }

    function toggleTableRow(row) {
    const isExpanded = row.classList.contains('expanded');

    // 1. بستن همه ردیف‌ها و حذف همه detail-row های موجود
    document.querySelectorAll('.expandable-row').forEach(r => {
        r.classList.remove('expanded');
    });
    document.querySelectorAll('.detail-row').forEach(dr => dr.remove());

    // 2. اگر ردیف کلیک‌شده از قبل باز نبود، بازش کن
    if (!isExpanded) {
        row.classList.add('expanded');
        const detail = row.dataset.detail;
        if (detail) {
            const detailRow = document.createElement('tr');
            detailRow.className = 'detail-row';
            detailRow.innerHTML = `
                <td colspan="3" style="padding: var(--spacing-md); background-color: rgba(0, 140, 155, 0.05); color: var(--xmind-light-blue); line-height: 1.8;">
                    ${detail}
                </td>
            `;
            row.parentNode.insertBefore(detailRow, row.nextSibling);
        }
    }
    // اگر isExpanded === true بود، در مرحله 1 بسته شد؛ کار دیگه‌ای لازمه نیست.
}


    /**
     * Toggle misconception card expansion
     */
    function toggleMisconception(card) {
        const isExpanded = card.classList.contains('expanded');
        const header = card.querySelector('.misconception-header');
        const expandBtn = card.querySelector('.expand-btn');
        
        // Toggle current card
        card.classList.toggle('expanded');
        expandBtn.setAttribute('aria-expanded', !isExpanded);
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    function init() {
        // Start Button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', scrollToSelector);
        }
        
        // Restart Button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', restartQuestionnaire);
        }
        
        // Comparison Table Rows
        const tableRows = document.querySelectorAll('.expandable-row');
        tableRows.forEach(row => {
            row.addEventListener('click', () => toggleTableRow(row));
            row.setAttribute('tabindex', '0');
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTableRow(row);
                }
            });
        });
        
        // Misconception Cards
        const misconceptionCards = document.querySelectorAll('.misconception-card');
        misconceptionCards.forEach(card => {
            const header = card.querySelector('.misconception-header');
            const expandBtn = card.querySelector('.expand-btn');
            
            if (header) {
                header.addEventListener('click', (e) => {
                    if (e.target !== expandBtn && !expandBtn.contains(e.target)) {
                        toggleMisconception(card);
                    }
                });
            }
            
            if (expandBtn) {
                expandBtn.addEventListener('click', () => toggleMisconception(card));
            }
        });
        
        // Diagram cards hover effects
        const diagramCards = document.querySelectorAll('.diagram-card');
        diagramCards.forEach(card => {
            const nodes = card.querySelectorAll('.diagram-node');
            const tooltip = card.querySelector('.diagram-tooltip');
            
            nodes.forEach(node => {
                node.addEventListener('mouseenter', () => {
                    tooltip.setAttribute('aria-hidden', 'false');
                });
                
                node.addEventListener('mouseleave', () => {
                    tooltip.setAttribute('aria-hidden', 'true');
                });
            });
        });
        
        // Initial render
        renderQuestion(0);
        updateProgress();
        
        console.log('XminD IoT Protocol Selector initialized successfully.');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();


document.querySelectorAll('.protected-image').forEach(img => {
    img.addEventListener('contextmenu', e => {
        e.preventDefault();
    });

    img.addEventListener('dragstart', e => {
        e.preventDefault();
    });
});


// =========================================
// Image Zoom Functionality
// =========================================
const zoomModal = document.getElementById('imageZoomModal');
const zoomedImage = document.getElementById('zoomedImage');
const zoomClose = document.querySelector('.zoom-close');
const zoomContainer = document.querySelector('.zoom-container');

// باز کردن مدال با کلیک روی تصویر
document.querySelectorAll('.protected-image').forEach(img => {
    img.addEventListener('click', function() {
        zoomedImage.src = this.src;
        zoomedImage.alt = this.alt;
        zoomModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // جلوگیری از اسکرول پس‌زمینه
        resetZoom();
    });
});

// بستن مدال
function closeModal() {
    zoomModal.classList.add('hidden');
    document.body.style.overflow = '';
    resetZoom();
}

zoomClose.addEventListener('click', closeModal);
zoomModal.addEventListener('click', function(e) {
    if (e.target === zoomModal || e.target === zoomContainer) {
        closeModal();
    }
});

// بستن با دکمه Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !zoomModal.classList.contains('hidden')) {
        closeModal();
    }
});

// Pinch to Zoom و Pan برای موبایل
let scale = 1, lastScale = 1;
let posX = 0, posY = 0, lastPosX = 0, lastPosY = 0;
let startDist = 0;
let isDragging = false;
let startX, startY;

function getDistance(touch1, touch2) {
    return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
    );
}

function updateTransform() {
    zoomedImage.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

function resetZoom() {
    scale = 1;
    lastScale = 1;
    posX = 0;
    posY = 0;
    lastPosX = 0;
    lastPosY = 0;
    updateTransform();
}

zoomedImage.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
        startDist = getDistance(e.touches[0], e.touches[1]);
        lastScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
        isDragging = true;
        startX = e.touches[0].clientX - lastPosX;
        startY = e.touches[0].clientY - lastPosY;
    }
}, { passive: true });

zoomedImage.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        scale = Math.max(1, Math.min(5, lastScale * (currentDist / startDist)));
        updateTransform();
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
        e.preventDefault();
        posX = e.touches[0].clientX - startX;
        posY = e.touches[0].clientY - startY;
        updateTransform();
    }
}, { passive: false });

zoomedImage.addEventListener('touchend', function(e) {
    if (e.touches.length < 2) {
        isDragging = false;
        lastPosX = posX;
        lastPosY = posY;
        if (scale <= 1) {
            posX = 0;
            posY = 0;
            lastPosX = 0;
            lastPosY = 0;
            updateTransform();
        }
    }
});

// دابل تپ برای زوم / خارج شدن از زوم
let lastTap = 0;
zoomedImage.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTap < 300 && e.touches.length === 0) {
        if (scale > 1) {
            resetZoom();
        } else {
            scale = 2.5;
            lastPosX = 0;
            lastPosY = 0;
            updateTransform();
        }
    }
    lastTap = now;
});

// پشتیبانی از ماوس در دسکتاپ (Scroll to Zoom)
zoomedImage.addEventListener('wheel', function(e) {
    if (!zoomModal.classList.contains('hidden')) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        scale = Math.max(1, Math.min(5, scale * delta));
        if (scale === 1) {
            posX = 0;
            posY = 0;
        }
        updateTransform();
    }
}, { passive: false });
