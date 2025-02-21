// Элементы DOM для работы с интерфейсом
const quizContainer = document.getElementById('quiz-container'); // Контейнер теста
let storyTitle = document.getElementById('story-title'); // Заголовок истории
let questionText = document.getElementById('question-text'); // Текст вопроса
let optionsContainer = document.getElementById('options-container'); // Контейнер вариантов ответа
let timerDiv = document.getElementById('timer'); // Отображение таймера
const storyButtons = document.querySelectorAll('.sidebar button'); // Кнопки выбора теста
const sidebar = document.querySelector('.sidebar'); // Сайдбар

// Глобальные переменные состояния теста
let currentStory = null; // Текущая история
let currentQuestionIndex = 0; // Индекс текущего вопроса
let correctAnswers = 0; // Количество правильных ответов
let timer = null; // ID таймера
let totalQuestions = 0; // Общее количество вопросов
let isQuizActive = false; // Флаг активности теста

// Функция запуска таймера
function startTimer(duration) {
    let timeLeft = duration; // Устанавливаем начальное время
    timerDiv.textContent = `Время: ${timeLeft} секунд`; // Показываем время

    if (timer) clearInterval(timer); // Очищаем существующий таймер

    timer = setInterval(() => { // Запускаем таймер
        timeLeft--;
        timerDiv.textContent = `Время: ${timeLeft} секунд`;
        if (timeLeft <= 0) { // Если время вышло
            clearInterval(timer);
            markUnanswered(); // Помечаем как неотвеченный
            setTimeout(showNextQuestion, 2000); // Переход к следующему вопросу
        }
    }, 1000);
}

// Помечаем неотвеченный вопрос
function markUnanswered() {
    const storyData = testData[currentStory];
    const correctAnswer = storyData.questions[currentQuestionIndex].correct;

    optionsContainer.childNodes.forEach((option, index) => {
        if (index === correctAnswer) option.classList.add('correct');
        else option.classList.add('incorrect');
    });
}

// Загрузка вопроса
function loadQuestion() {
    const storyData = testData[currentStory];
    const questionData = storyData.questions[currentQuestionIndex];

    questionText.textContent = `Вопрос ${currentQuestionIndex + 1} из ${totalQuestions}: ${questionData.question}`;
    optionsContainer.innerHTML = ''; // Очищаем варианты

    questionData.options.forEach((option, index) => { // Создаем варианты ответа
        const optionElement = document.createElement('label');
        optionElement.className = 'option';
        optionElement.innerHTML = `<input type="radio" name="option" value="${index}"> ${option}`;
        optionElement.addEventListener('click', () => checkAnswer(index));
        optionsContainer.appendChild(optionElement);
    });

    startTimer(30); // Запускаем таймер на 30 секунд
}

// Проверка выбранного ответа
function checkAnswer(selectedIndex) {
    clearInterval(timer); // Останавливаем таймер
    const storyData = testData[currentStory];
    const correctAnswer = storyData.questions[currentQuestionIndex].correct;

    optionsContainer.querySelectorAll('input[type="radio"]').forEach(input => {
        input.disabled = true; // Отключаем выбор
    });

    optionsContainer.childNodes.forEach((option, index) => {
        if (index === correctAnswer) option.classList.add('correct');
        if (index === selectedIndex && selectedIndex !== correctAnswer) option.classList.add('incorrect');
    });

    if (selectedIndex === correctAnswer) correctAnswers++; // Увеличиваем счетчик

    setTimeout(showNextQuestion, 1500); // Переход к следующему
}

// Переход к следующему вопросу
function showNextQuestion() {
    clearInterval(timer);
    currentQuestionIndex++;

    if (currentQuestionIndex < totalQuestions) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Показ результатов
function showResults() {
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Сохраняем завершение теста
    localStorage.setItem(`quiz_${currentStory}_completed`, 'true');
    localStorage.removeItem(`quiz_${currentStory}_started`);
    isQuizActive = false; // Тест завершен, сбрасываем флаг

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

// Сброс теста
function resetQuiz() {
    currentStory = null;
    currentQuestionIndex = 0;
    correctAnswers = 0;
    totalQuestions = 0;
    isQuizActive = false; // Сбрасываем флаг активности

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
    sidebar.classList.remove('hidden');
    checkQuizAvailability(); // Проверяем доступность
}

// Проверка доступности тестов
function checkQuizAvailability() {
    storyButtons.forEach(button => {
        const storyKey = button.getAttribute('data-story');
        const isCompleted = localStorage.getItem(`quiz_${storyKey}_completed`);
        const isStarted = localStorage.getItem(`quiz_${storyKey}_started`);

        if (isCompleted === 'true' || isStarted === 'true') {
            button.disabled = true;
            button.textContent = `${testData[storyKey].title} (Недоступно)`;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        }
    });
}

// Блокировка теста при уходе со страницы
function blockQuiz() {
    if (!isQuizActive || localStorage.getItem(`quiz_${currentStory}_completed`) === 'true') return; // Если тест не активен или завершен, ничего не делаем

    clearInterval(timer); // Останавливаем таймер
    isQuizActive = false; // Отмечаем тест как неактивный
    localStorage.setItem(`quiz_${currentStory}_started`, 'true'); // Фиксируем, что тест начат

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

// Инициализация кнопок
function initializeStoryButtons() {
    storyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const storyKey = button.getAttribute('data-story');
            const isCompleted = localStorage.getItem(`quiz_${storyKey}_completed`);
            const isStarted = localStorage.getItem(`quiz_${storyKey}_started`);

            if (isCompleted === 'true' || isStarted === 'true') {
                alert('Этот тест уже был начат или завершен и теперь недоступен!');
                return;
            }

            currentStory = storyKey;
            currentQuestionIndex = 0;
            correctAnswers = 0;
            totalQuestions = testData[currentStory].questions.length;

            localStorage.setItem(`quiz_${currentStory}_started`, 'true'); // Отмечаем начало
            isQuizActive = true; // Устанавливаем флаг активности

            quizContainer.classList.remove('hidden');
            storyTitle.textContent = testData[currentStory].title;
            sidebar.classList.add('hidden');
            loadQuestion();
        });
    });
}

// Обработчик видимости страницы
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isQuizActive) { // Если вкладка стала невидимой и тест активен
        blockQuiz(); // Блокируем тест
    }
});

// Обработчик закрытия страницы
window.addEventListener('beforeunload', () => {
    if (isQuizActive && localStorage.getItem(`quiz_${currentStory}_completed`) !== 'true') {
        blockQuiz(); // Блокируем тест при закрытии
    }
});

// Инициализация при загрузке
window.addEventListener('load', () => {
    checkQuizAvailability();
    initializeStoryButtons();

    // Проверяем, был ли тест начат ранее
    storyButtons.forEach(button => {
        const storyKey = button.getAttribute('data-story');
        if (localStorage.getItem(`quiz_${storyKey}_started`) === 'true' && 
            localStorage.getItem(`quiz_${storyKey}_completed`) !== 'true') {
            currentStory = storyKey;
            blockQuiz(); // Блокируем, если тест был начат
        }
    });
});