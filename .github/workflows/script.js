// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDHliWG6J_6iTarmqIMnrBjAjNSG0MPihk",
  authDomain: "huxtextigm.firebaseapp.com",
  projectId: "huxtextigm",
  storageBucket: "huxtextigm.firebasestorage.app",
  messagingSenderId: "496908406007",
  appId: "1:496908406007:web:dbbfb8d24b1a286daf57f2",
  measurementId: "G-SG23YZ7P3L"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const streamersRef = ref(database, 'streamers');

// Конфигурация Twitch
const CLIENT_ID = 'jwu0u09msnrrglvfuydirl7uwt77cd';
const CLIENT_SECRET = 'bsvh8pnlsqpcxv4y0eg40h0ahunqzi';

// Получаем элементы DOM
const streamersContainer = document.getElementById('streamersContainer');
const addStreamerBtn = document.getElementById('addStreamerBtn');
const streamerInput = document.getElementById('streamerInput');
const errorMessage = document.getElementById('errorMessage');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const sortButtons = document.querySelectorAll('.btn-sort');

// Переменные
let trackedStreamers = [];
let currentSort = 'name';
let accessToken = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initAnimatedBackground();
        await authenticateWithTwitch();
        
        // Загружаем стримеров из Firebase
        onValue(streamersRef, (snapshot) => {
            const data = snapshot.val();
            trackedStreamers = data ? Object.values(data) : [];
            loadTrackedStreamers();
        });
        
        // Устанавливаем активную кнопку сортировки
        sortButtons.forEach(btn => {
            if (btn.dataset.sort === currentSort) {
                btn.classList.add('active');
            }
        });
        
        // Обработчики событий
        addStreamerBtn.addEventListener('click', addStreamer);
        streamerInput.addEventListener('keypress', (e) => e.key === 'Enter' && addStreamer());
        deleteAllBtn.addEventListener('click', deleteAllStreamers);
        
        // Обработчики сортировки
        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sortButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSort = btn.dataset.sort;
                loadTrackedStreamers();
            });
        });
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});

// Анимация фона (оставлена без изменений)
function initAnimatedBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'animeBg';
    document.body.prepend(canvas);
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    const particles = [];
    const colors = ['#ff6b9e', '#9d65c9', '#4da6ff', '#5cdb95'];
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.opacity = Math.random() * 0.3 + 0.1;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
        }
    }
    
    function init() {
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        
        // Соединяем частицы
        for (let i = 0; i < particles.length; i++) {
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = particles[i].color;
                    ctx.globalAlpha = 0.2 - (distance / 100) * 0.2;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    init();
    animate();
}

// Аутентификация с Twitch
async function authenticateWithTwitch() {
    try {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials'
            })
        });
        
        const data = await response.json();
        accessToken = data.access_token;
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        showError('Ошибка подключения к Twitch API');
    }
}

// Получение информации о стримерах
async function getStreamersInfo(logins) {
    if (logins.length === 0) return [];
    
    try {
        const response = await fetch(`https://api.twitch.tv/helix/users?${logins.map(login => `login=${login}`).join('&')}`, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Ошибка получения информации о стримерах:', error);
        return [];
    }
}

// Получение информации о текущих стримах
async function getStreamsInfo(logins) {
    if (logins.length === 0) return [];
    
    try {
        const response = await fetch(`https://api.twitch.tv/helix/streams?${logins.map(login => `user_login=${login}`).join('&')}`, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Ошибка получения информации о стримах:', error);
        return [];
    }
}

// Получение информации о прошлых стримах (видео)
async function getVideosInfo(logins) {
    if (logins.length === 0) return {};
    
    try {
        const streamersInfo = await getStreamersInfo(logins);
        const result = {};
        
        // Для каждого стримера получаем последние видео
        for (const streamer of streamersInfo) {
            const login = streamer.login.toLowerCase();
            const userId = streamer.id;
            
            const response = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=1`, {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            const data = await response.json();
            result[login] = data.data || [];
        }
        
        return result;
    } catch (error) {
        console.error('Ошибка получения информации о видео:', error);
        return {};
    }
}

// Загрузка отслеживаемых стримеров
async function loadTrackedStreamers() {
    if (!accessToken || trackedStreamers.length === 0) {
        streamersContainer.innerHTML = '';
        return;
    }
    
    try {
        const [streamersInfo, streamsInfo, videosInfo] = await Promise.all([
            getStreamersInfo(trackedStreamers),
            getStreamsInfo(trackedStreamers),
            getVideosInfo(trackedStreamers)
        ]);
        
        const sortedStreamers = sortStreamers(trackedStreamers, streamersInfo, streamsInfo, currentSort);
        
        // Очищаем контейнер перед загрузкой
        streamersContainer.innerHTML = '';
        
        // Сначала отображаем онлайн стримеров
        const onlineStreamers = sortedStreamers.filter(login => 
            streamsInfo.some(s => s.user_login.toLowerCase() === login)
        );
        
        // Затем оффлайн стримеров
        const offlineStreamers = sortedStreamers.filter(login => 
            !streamsInfo.some(s => s.user_login.toLowerCase() === login)
        );
        
        const allStreamers = [...onlineStreamers, ...offlineStreamers];
        
        allStreamers.forEach(login => {
            const streamer = streamersInfo.find(s => s.login.toLowerCase() === login);
            if (streamer) {
                const stream = streamsInfo.find(s => s.user_login.toLowerCase() === login);
                const videos = videosInfo[login] || [];
                createStreamerCard(streamer, stream, videos);
            }
        });
        
        checkForStatusChanges();
        updateScroll();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Сортировка стримеров
function sortStreamers(logins, streamersInfo, streamsInfo, sortBy) {
    return [...logins].sort((a, b) => {
        const streamerA = streamersInfo.find(s => s.login.toLowerCase() === a.toLowerCase());
        const streamerB = streamersInfo.find(s => s.login.toLowerCase() === b.toLowerCase());
        const streamA = streamsInfo.find(s => s.user_login.toLowerCase() === a.toLowerCase());
        const streamB = streamsInfo.find(s => s.user_login.toLowerCase() === b.toLowerCase());
        
        switch(sortBy) {
            case 'name':
                return streamerA.display_name.localeCompare(streamerB.display_name);
            case 'date':
                const dateA = streamA?.started_at || '';
                const dateB = streamB?.started_at || '';
                return new Date(dateB) - new Date(dateA);
            case 'viewers':
                return (streamB?.viewer_count || 0) - (streamA?.viewer_count || 0);
            default:
                return 0;
        }
    });
}

function createStreamerCard(streamer, stream, videos) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 animate__animated animate__fadeIn';
    
    const isLive = !!stream;
    const lastVideo = videos[0];
    
    // Определяем данные для отображения
    const lastStreamDate = isLive ? stream.started_at : 
                          lastVideo ? lastVideo.created_at : '';
    
    const lastStreamTitle = isLive ? stream.title : 
                           lastVideo ? lastVideo.title : '';
    
    const gameName = isLive ? stream.game_name : 
                    lastVideo ? lastVideo.game_name : '';
    
    const duration = lastVideo ? formatDuration(lastVideo.duration) : null;

    card.innerHTML = `
        <div class="streamer-card h-100">
            <button class="remove-btn" data-login="${streamer.login}" title="Удалить">
                <i class="fas fa-times"></i>
            </button>
            <div class="d-flex">
                <img src="${streamer.profile_image_url}" alt="${streamer.display_name}" 
                     class="streamer-avatar me-3" data-login="${streamer.login}">
                <div class="flex-grow-1">
                    <h5 class="streamer-name mb-2" data-login="${streamer.login}">${streamer.display_name}</h5>
                    
                    <div class="d-flex align-items-center mb-2">
                        <span class="stream-status ${isLive ? 'status-live' : 'status-offline'}"></span>
                        <span class="stream-info">${isLive ? 'В эфире' : 'Не в эфире'}</span>
                        ${isLive ? `<span class="stream-info ms-2"><i class="fas fa-users me-1"></i> <span class="viewer-count">${formatNumber(stream.viewer_count)}</span> зрителей</span>` : ''}
                    </div>
                    
                    ${(isLive || lastStreamTitle) ? 
                        `<p class="stream-title mb-2" data-fulltitle="${isLive ? stream.title : lastStreamTitle}" data-login="${streamer.login}">
                            ${isLive ? stream.title : lastStreamTitle}
                        </p>` : ''
                    }
                    
                    ${gameName ? 
                        `<span class="game-info"><i class="fas fa-gamepad me-1"></i> ${gameName}</span>` : ''
                    }
                    
                    <div class="stream-info mt-2">
                        ${isLive ? 
                            `<div>
                                <i class="far fa-clock me-1"></i> Начало: ${formatDate(stream.started_at)}
                                <span class="ms-2"><i class="fas fa-hourglass-half me-1"></i> Длительность: ${formatStreamDuration(stream.started_at)}</span>
                            </div>` :
                            lastStreamDate ? 
                                `<i class="far fa-clock me-1"></i> Последний стрим: ${formatDate(lastStreamDate)} (${getTimeSince(lastStreamDate)})` :
                                `<i class="far fa-clock me-1"></i> Данные о стримах отсутствуют`
                        }
                    </div>
                    
                    ${duration && !isLive ? 
                        `<div class="stream-history"><i class="fas fa-history me-1"></i> Длительность: ${duration}</div>` : ''
                    }
                </div>
            </div>
        </div>
    `;
    
    streamersContainer.appendChild(card);
    
    // Обработчик для кнопки удаления
    const removeBtn = card.querySelector('.remove-btn');
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.target.closest('.col-md-6').classList.add('animate__fadeOut');
        setTimeout(() => removeStreamer(streamer.login), 300);
    });
    
    // Функция перехода на канал
    const openChannel = () => window.open(`https://twitch.tv/${streamer.login}`, '_blank');
    
    // Обработчики для аватарки и имени
    const avatar = card.querySelector('.streamer-avatar');
    const name = card.querySelector('.streamer-name');
    
    avatar.addEventListener('click', openChannel);
    name.addEventListener('click', openChannel);
}

// Добавление стримера
async function addStreamer() {
    const login = streamerInput.value.trim().toLowerCase();
    
    if (!login) {
        showError('Введите логин стримера');
        return;
    }
    
    if (trackedStreamers.includes(login)) {
        showError('Этот стример уже добавлен');
        return;
    }
    
    try {
        const response = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            showError('Стример не найден');
            return;
        }
        
        // Добавляем стримера в Firebase
        const newStreamerRef = push(streamersRef);
        set(newStreamerRef, login);
        
        streamerInput.value = '';
        errorMessage.textContent = '';
    } catch (error) {
        console.error('Ошибка при добавлении стримера:', error);
        showError('Ошибка при добавлении стримера');
    }
}

// Удаление стримера
function removeStreamer(login) {
    onValue(streamersRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val() === login) {
                remove(ref(database, `streamers/${childSnapshot.key}`));
            }
        });
    });
}

// Удаление всех стримеров
function deleteAllStreamers() {
    remove(streamersRef);
}

// Проверка изменений статуса для уведомлений в Telegram
function checkForStatusChanges() {
    const previousData = JSON.parse(localStorage.getItem('previousStreamersData')) || {};
    
    // Получаем текущие данные о стримах
    getStreamsInfo(trackedStreamers).then(currentStreams => {
        trackedStreamers.forEach(login => {
            const currentStatus = currentStreams.some(s => s.user_login.toLowerCase() === login) ? 'online' : 'offline';
            const previousStatus = previousData[login];
            
            // Если статус изменился
            if (previousStatus && currentStatus !== previousStatus) {
                const streamer = currentStreams.find(s => s.user_login.toLowerCase() === login) || { user_name: login };
                
                if (currentStatus === 'online') {
                    const message = `${streamer.user_name} начал стрим! ${streamer.title}`;
                    sendTelegramNotification(message);
                } else if (currentStatus === 'offline') {
                    const message = `${streamer.user_name} закончил стрим`;
                    sendTelegramNotification(message);
                }
            }
            
            // Сохраняем текущий статус
            previousData[login] = currentStatus;
        });
        
        // Сохраняем данные для следующей проверки
        localStorage.setItem('previousStreamersData', JSON.stringify(previousData));
    });
}

// Отправка уведомления в Telegram
function sendTelegramNotification(message) {
    // Здесь нужно использовать API вашего Telegram бота
    // Пример:
    const botToken = '7061823038:AAEYGevWxELoCZzDO9JV6CoC6egj63ZE8hE';
    const chatId = '-4836085644';
    
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message
        })
    }).catch(error => console.error('Ошибка отправки уведомления:', error));
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return 'нет данных';
    
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatStreamDuration(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;
    
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    let result = '';
    if (hours > 0) result += `${hours} ч. `;
    if (minutes > 0) result += `${minutes} мин. `;
    result += `${seconds} сек.`;
    
    return result;
}

// Форматирование длительности
function formatDuration(duration) {
    if (!duration) return '';
    
    const hours = duration.match(/(\d+)h/);
    const minutes = duration.match(/(\d+)m/);
    const seconds = duration.match(/(\d+)s/);
    
    let result = '';
    if (hours) result += `${hours[1]} ч. `;
    if (minutes) result += `${minutes[1]} мин. `;
    if (seconds) result += `${seconds[1]} сек.`;
    
    return result.trim() || duration;
}

// Получение времени с последнего стрима (изменено для отображения времени с конца стрима)
function getTimeSince(dateString) {
    if (!dateString) return '';
    
    const now = new Date();
    const then = new Date(dateString);
    const diff = now - then;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    
    if (years > 0) return `был ${years} г. назад`;
    if (months > 0) return `был ${months} мес. назад`;
    if (days > 0) return `был ${days} д. назад`;
    if (hours > 0) return `был ${hours} ч. назад`;
    if (minutes > 0) return `был ${minutes} мин. назад`;
    return `был ${seconds} сек. назад`;
}

// Форматирование чисел (для количества зрителей)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Отображение ошибки
function showError(message) {
    errorMessage.textContent = message;
    setTimeout(() => {
        errorMessage.textContent = '';
    }, 3000);
}

// Периодическое обновление данных (каждую минуту)
setInterval(() => {
    if (trackedStreamers.length > 0) {
        loadTrackedStreamers();
    }
}, 60000);

// Обновление при возвращении на вкладку
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && trackedStreamers.length > 0) {
        loadTrackedStreamers();
    }
});

// Управление скроллом страницы
function updateScroll() {
    if (trackedStreamers.length > 4) {
        document.body.style.overflowY = 'auto';
    } else {
        document.body.style.overflowY = 'hidden';
    }
}

// Инициализация скролла при загрузке
updateScroll();
