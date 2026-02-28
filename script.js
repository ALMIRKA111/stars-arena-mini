// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Данные
let currentUser = null;
let selectedAmount = null;
let myBet = {
    amount: 0,
    color: null,
    percent: 0
};

// Получаем пользователя
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    currentUser = tg.initDataUnsafe.user;
    document.getElementById('username').textContent = currentUser.first_name || 'Игрок';
} else {
    currentUser = { id: 123456789, first_name: 'Тест' };
    document.getElementById('username').textContent = 'Тестовый режим';
}

// Данные рулетки
let rouletteData = {
    balance: 99.10,  // Баланс пользователя
    bank: 0,          // Общий банк
    players: []       // Игроки: { color: 'red/green', amount, percent }
};

// Цвета
const colors = ['🔴 Красный', '🟢 Зеленый'];

// Обновление интерфейса
function updateUI() {
    // Баланс и банк
    document.getElementById('balance').textContent = rouletteData.balance.toFixed(2);
    document.getElementById('bank').textContent = rouletteData.bank.toFixed(2);

    // Список игроков (проценты)
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';

    if (rouletteData.players.length === 0) {
        playersList.innerHTML = '<div class="player-item" style="color: #8e9ab0;">Ожидаем игроков...</div>';
    } else {
        // Группируем по цветам
        let redTotal = 0, greenTotal = 0;
        rouletteData.players.forEach(p => {
            if (p.color === '🔴 Красный') redTotal += p.amount;
            else greenTotal += p.amount;
        });

        // Общий банк
        const total = redTotal + greenTotal;

        // Показываем проценты цветов
        const redPercent = total > 0 ? ((redTotal / total) * 100).toFixed(2) : 0;
        const greenPercent = total > 0 ? ((greenTotal / total) * 100).toFixed(2) : 0;

        playersList.innerHTML = `
            <div class="player-item">
                <span class="player-name">🔴 Красный</span>
                <span class="player-percent">${redPercent}%</span>
            </div>
            <div class="player-item">
                <span class="player-name">🟢 Зеленый</span>
                <span class="player-percent">${greenPercent}%</span>
            </div>
        `;
    }

    // Информация о текущей ставке
    if (myBet.amount > 0) {
        document.getElementById('bet-amount').textContent = myBet.amount.toFixed(2);
        document.getElementById('bet-percent').textContent = myBet.percent.toFixed(2);
        document.getElementById('bet-color').textContent = myBet.color || 'Нет';
        document.getElementById('current-bet').style.display = 'block';
        document.getElementById('place-bet').style.display = 'block';
    } else {
        document.getElementById('current-bet').style.display = 'none';
        document.getElementById('place-bet').style.display = 'none';
    }
}

// Выбор суммы
document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAmount = parseFloat(btn.dataset.amount);
    });
});

// Кнопка ОК
document.getElementById('ok-btn').addEventListener('click', () => {
    if (!selectedAmount) {
        tg.showAlert('❌ Выбери сумму ставки!');
        return;
    }

    if (selectedAmount > rouletteData.balance) {
        tg.showAlert('❌ Недостаточно средств!');
        return;
    }

    // Рандомный цвет
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Процент пока неизвестен (будет после ставки)
    myBet = {
        amount: selectedAmount,
        color: randomColor,
        percent: 0
    };

    // Показываем предпросмотр
    document.getElementById('preview-amount').textContent = selectedAmount.toFixed(2);
    document.getElementById('preview-color').textContent = randomColor;
    document.getElementById('bet-preview').style.display = 'block';
    document.getElementById('place-bet').style.display = 'block';

    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
});

// Кнопка СДЕЛАТЬ СТАВКУ
document.getElementById('place-bet').addEventListener('click', () => {
    if (myBet.amount === 0) return;

    // Добавляем игрока
    rouletteData.players.push({
        color: myBet.color,
        amount: myBet.amount
    });

    // Обновляем банк
    rouletteData.bank += myBet.amount;
    rouletteData.balance -= myBet.amount;

    // Пересчитываем проценты для всех
    let totalByColor = { '🔴 Красный': 0, '🟢 Зеленый': 0 };
    rouletteData.players.forEach(p => {
        totalByColor[p.color] += p.amount;
    });

    // Процент текущего игрока
    const myColorTotal = totalByColor[myBet.color];
    myBet.percent = (myBet.amount / myColorTotal) * 100;

    // Обновляем интерфейс
    updateUI();

    // Скрываем кнопки
    document.getElementById('bet-preview').style.display = 'none';
    document.getElementById('place-bet').style.display = 'none';
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));

    // Анимация
    spinWheel();

    // Уведомление
    tg.showPopup({
        title: '✅ Ставка принята!',
        message: `Ты поставил ${myBet.amount}⭐ на ${myBet.color}\nТвой шанс: ${myBet.percent.toFixed(2)}%`,
        buttons: [{ type: 'ok' }]
    });

    if (tg.HapticFeedback) {
        tg.HapticFeedback.notification('success');
    }
});

// Анимация колеса (для красоты)
function spinWheel() {
    const wheel = document.getElementById('wheel');
    wheel.style.transition = 'transform 2s ease-out';
    wheel.style.transform = `rotate(${720 + Math.random() * 360}deg)`;

    setTimeout(() => {
        wheel.style.transition = 'none';
    }, 2000);
}

// Кнопка Telegram
tg.MainButton.setText('🔄 Обновить');
tg.MainButton.onClick(updateUI);
tg.MainButton.show();

// Запуск
updateUI();