const quizContainer = document.getElementById('quiz-container');
let storyTitle = document.getElementById('story-title');
let questionText = document.getElementById('question-text');
let optionsContainer = document.getElementById('options-container');
let timerDiv = document.getElementById('timer');
const storyButtons = document.querySelectorAll('.sidebar button');
const sidebar = document.getElementById('sidebar');
const variantContainer = document.getElementById('variant-container');
const variantButtons = document.querySelectorAll('.variant-container button');

let currentStory = null;
let currentQuestionIndex = 0;
let correctAnswers = 0;
let timer = null;
let totalQuestions = 0;
let isQuizActive = false;
let testData = null;
let currentQuestions = []; // Для хранения перемешанных вопросов

// Функция для перемешивания массива
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startTimer(duration) {
    let timeLeft = duration;
    timerDiv.textContent = `Время: ${timeLeft} секунд`;

    if (timer) clearInterval(timer);

    timer = setInterval(() => {
        timeLeft--;
        timerDiv.textContent = `Время: ${timeLeft} секунд`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            markUnanswered();
            setTimeout(showNextQuestion, 2000);
        }
    }, 1000);
}

function markUnanswered() {
    const correctAnswer = currentQuestions[currentQuestionIndex].correct;

    optionsContainer.childNodes.forEach((option, index) => {
        if (index === correctAnswer) option.classList.add('correct');
        else option.classList.add('incorrect');
    });
}

function loadQuestion() {
    const questionData = currentQuestions[currentQuestionIndex];

    questionText.textContent = `Вопрос ${currentQuestionIndex + 1} из ${totalQuestions}: ${questionData.question}`;
    optionsContainer.innerHTML = '';

    questionData.options.forEach((option, index) => {
        const optionElement = document.createElement('label');
        optionElement.className = 'option';
        optionElement.innerHTML = `<input type="radio" name="option" value="${index}"> ${option}`;
        optionElement.addEventListener('click', () => checkAnswer(index));
        optionsContainer.appendChild(optionElement);
    });

    startTimer(30);
}

function checkAnswer(selectedIndex) {
    clearInterval(timer);
    const correctAnswer = currentQuestions[currentQuestionIndex].correct;

    optionsContainer.querySelectorAll('input[type="radio"]').forEach(input => {
        input.disabled = true;
    });

    optionsContainer.childNodes.forEach((option, index) => {
        if (index === correctAnswer) option.classList.add('correct');
        if (index === selectedIndex && selectedIndex !== correctAnswer) option.classList.add('incorrect');
    });

    if (selectedIndex === correctAnswer) correctAnswers++;

    setTimeout(showNextQuestion, 1500);
}

function showNextQuestion() {
    clearInterval(timer);
    currentQuestionIndex++;

    if (currentQuestionIndex < totalQuestions) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    localStorage.setItem(`quiz_${currentStory}_completed`, 'true');
    localStorage.removeItem(`quiz_${currentStory}_started`);
    isQuizActive = false;

    const resultsHTML = `
        <div class="story-header" id="story-title">${testData[currentStory].title}</div>
        <div class="question" style="text-align: center;">
            <h2 style="margin-bottom: 20px;">Тест завершен!</h2>
            <div class="question-text" style="font-size: 18px;">
                <p>Правильных ответов: ${correctAnswers} из ${totalQuestions}</p>
                <p style="font-size: 24px; margin: 20px 0;">Ваш результат: ${score} баллов из 100</p>
            </div>
            <button onclick="resetQuiz()" style="padding: 10px 20px; margin-top: 20px;" class="next-btn">
                Вернуться к выбору теста
            </button>
        </div>
    `;
    quizContainer.innerHTML = resultsHTML;
}

function resetQuiz() {
    currentStory = null;
    currentQuestionIndex = 0;
    correctAnswers = 0;
    totalQuestions = 0;
    isQuizActive = false;
    currentQuestions = []; // Сброс перемешанных вопросов

    quizContainer.innerHTML = `
        <div class="story-header" id="story-title"></div>
        <div class="question">
            <div class="question-text" id="question-text"></div>
            <div class="options" id="options-container"></div>
        </div>
        <div class="timer" id="timer"></div>
    `;

    storyTitle = document.getElementById('story-title');
    questionText = document.getElementById('question-text');
    optionsContainer = document.getElementById('options-container');
    timerDiv = document.getElementById('timer');

    quizContainer.classList.add('hidden');
    sidebar.classList.add('hidden');
    variantContainer.classList.remove('hidden');
    checkQuizAvailability();
}

function checkQuizAvailability() {
    if (!testData) return;
    storyButtons.forEach(button => {
        const storyKey = button.getAttribute('data-story');
        const isCompleted = localStorage.getItem(`quiz_${storyKey}_completed`);
        const isStarted = localStorage.getItem(`quiz_${storyKey}_started`);

        if (isCompleted === 'true' || isStarted === 'true') {
            button.disabled = true;
            button.textContent = testData[storyKey] ? `${testData[storyKey].title} (Недоступно)` : `${storyKey} (Недоступно)`;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        }
    });
}

function blockQuiz() {
    if (!isQuizActive || localStorage.getItem(`quiz_${currentStory}_completed`) === 'true') return;

    clearInterval(timer);
    isQuizActive = false;
    localStorage.setItem(`quiz_${currentStory}_started`, 'true');

    quizContainer.innerHTML = `
        <div class="story-header" id="story-title">${testData[currentStory].title}</div>
        <div class="question" style="text-align: center;">
            <h2 style="margin-bottom: 20px;">Тест заблокирован!</h2>
            <div class="question-text" style="font-size: 18px;">
                <p>Вы покинули страницу во время теста. Продолжение невозможно.</p>
            </div>
            <button onclick="resetQuiz()" style="padding: 10px 20px; margin-top: 20px;" class="next-btn">
                Вернуться к выбору теста
            </button>
        </div>
    `;
}

function initializeVariantButtons() {
    variantButtons.forEach(button => {
        button.addEventListener('click', () => {
            const variant = button.getAttribute('data-variant');
            loadTestData(variant);
        });
    });
}

function loadTestData(variant) {
    const existingScript = document.querySelector(`script[src="testData${variant}.js"]`);
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.src = `testData${variant}.js`;
    script.onload = () => {
        if (!window.testData) {
            alert('Данные не найдены в testData' + variant + '.js');
            return;
        }
        testData = window.testData;
        console.log('Загружен testData для варианта ' + variant, testData);
        variantContainer.classList.add('hidden');
        sidebar.classList.remove('hidden');
        initializeStoryButtons();
        checkQuizAvailability();
    };
    script.onerror = () => {
        alert('Ошибка загрузки testData' + variant + '.js. Проверьте наличие файла и его содержимое.');
    };
    document.body.appendChild(script);
}

function initializeStoryButtons() {
    storyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const storyKey = button.getAttribute('data-story');
            const isCompleted = localStorage.getItem(`quiz_${storyKey}_completed`);
            const isStarted = localStorage.getItem(`quiz_${storyKey}_started`);

            if (!testData) {
                alert('Данные теста ещё не загружены. Попробуйте выбрать вариант заново.');
                return;
            }

            if (!testData[storyKey]) {
                alert('Данные для рассказа "' + storyKey + '" отсутствуют в выбранном варианте!');
                return;
            }

            if (isCompleted === 'true' || isStarted === 'true') {
                alert('Этот тест уже был начат или завершен и теперь недоступен!');
                return;
            }

            currentStory = storyKey;
            const originalQuestions = testData[currentStory].questions;

            // Перемешивание вопросов и вариантов
            const shuffledQuestions = JSON.parse(JSON.stringify(originalQuestions));
            shuffleArray(shuffledQuestions);

            shuffledQuestions.forEach(question => {
                const options = question.options;
                const correctAnswer = question.correct;

                const indexedOptions = options.map((option, index) => ({ option, originalIndex: index }));
                shuffleArray(indexedOptions);

                const newCorrect = indexedOptions.findIndex(item => item.originalIndex === correctAnswer);
                question.correct = newCorrect;
                question.options = indexedOptions.map(item => item.option);
            });

            currentQuestions = shuffledQuestions;
            totalQuestions = currentQuestions.length;
            currentQuestionIndex = 0;
            correctAnswers = 0;
            localStorage.setItem(`quiz_${currentStory}_started`, 'true');
            isQuizActive = true;

            sidebar.classList.add('hidden');
            quizContainer.classList.remove('hidden');
            storyTitle.textContent = testData[currentStory].title;
            loadQuestion();
        });
    });
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isQuizActive) {
        blockQuiz();
    }
});

window.addEventListener('beforeunload', () => {
    if (isQuizActive && localStorage.getItem(`quiz_${currentStory}_completed`) !== 'true') {
        blockQuiz();
    }
});

window.addEventListener('load', () => {
    initializeVariantButtons();
});

document.addEventListener('keydown', (event) => {
    if (event.key === '5') {
        // Очищаем localStorage для всех тестов
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('quiz_')) {
                localStorage.removeItem(key);
            }
        });

        // Обновляем состояние кнопок в сайдбаре
        storyButtons.forEach(button => {
            const storyKey = button.getAttribute('data-story');
            if (testData && testData[storyKey]) {
                button.disabled = false;
                button.textContent = testData[storyKey].title;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
        });

        // Сбрасываем интерфейс к начальному состоянию
        resetQuiz();
    }
});