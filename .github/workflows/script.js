// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDHliWG6J_6iTarmqIMnrBjAjNSG0MPihk",
    authDomain: "huxtextigm.firebaseapp.com",
    databaseURL: "https://huxtextigm-default-rtdb.firebaseio.com",
    projectId: "huxtextigm",
    storageBucket: "huxtextigm.appspot.com",
    messagingSenderId: "496908406007",
    appId: "1:496908406007:web:fc3e41b97428246caf57f2",
    measurementId: "G-K3JG0FBLQK"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const userId = "shared_global_user"; // Общий ID для всех пользователей

// Конфигурация Twitch API
const CLIENT_ID = 'jwu0u09msnrrglvfuydirl7uwt77cd';
const CLIENT_SECRET = 'bsvh8pnlsqpcxv4y0eg40h0ahunqzi';

// Конфигурация Telegram бота
const TELEGRAM_BOT_TOKEN = '7061823038:AAEYGevWxELoCZzDO9JV6CoC6egj63ZE8hE';
const TELEGRAM_CHAT_ID = '-4836085644';

// Получаем элементы DOM
const streamersContainer = document.getElementById('streamersContainer');
const addStreamerBtn = document.getElementById('addStreamerBtn');
const streamerInput = document.getElementById('streamerInput');
const errorMessage = document.getElementById('errorMessage');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const sortButtons = document.querySelectorAll('.btn-sort');
const notificationToast = new bootstrap.Toast(document.querySelector('.toast'));

// Переменные состояния
let trackedStreamers = [];
let currentSort = 'name';
let accessToken = null;
let updateInterval;
let lastUpdateTime = 0;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initAnimatedBackground();
        await authenticateWithTwitch();
        
        // Загружаем данные из Firebase
        await loadInitialData();
        
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
                saveToFirebase('currentSort', currentSort);
                loadTrackedStreamers();
            });
        });
        
        // Периодическое обновление данных (каждые 5 минут)
        setupUpdateInterval();
        
        // Обновляем данные при возвращении на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                const now = Date.now();
                // Если прошло больше 2 минут с последнего обновления
                if (now - lastUpdateTime > 2 * 60 * 1000) {
                    loadTrackedStreamers();
                }
            }
        });
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Ошибка инициализации приложения');
    }
});

// Настройка интервала обновления
function setupUpdateInterval() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
        if (trackedStreamers.length > 0) {
            loadTrackedStreamers();
        }
    }, 2 * 60 * 1000); // 2 минут
}

// Показать ошибку
function showError(message, duration = 3000) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => errorMessage.style.display = 'none', duration);
}

// Загрузка начальных данных из Firebase
async function loadInitialData() {
    try {
        // Загружаем список стримеров
        const streamersRef = database.ref(`users/${userId}/trackedStreamers`);
        streamersRef.on('value', (snapshot) => {
            trackedStreamers = snapshot.val() || [];
            loadTrackedStreamers();
        });
        
        // Загружаем настройки сортировки
        const sortRef = database.ref(`users/${userId}/currentSort`);
        sortRef.on('value', (snapshot) => {
            currentSort = snapshot.val() || 'name';
            sortButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.sort === currentSort) {
                    btn.classList.add('active');
                }
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки данных из Firebase:', error);
        showError('Ошибка загрузки данных');
    }
}

// Сохранение данных в Firebase
async function saveToFirebase(path, value) {
    try {
        await database.ref(`users/${userId}/${path}`).set(value);
    } catch (error) {
        console.error('Ошибка сохранения в Firebase:', error);
        showError('Ошибка сохранения данных');
    }
}

// Анимация фона
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
        
        if (!response.ok) {
            throw new Error('Ошибка аутентификации Twitch');
        }
        
        const data = await response.json();
        accessToken = data.access_token;
        
        // Обновляем токен перед истечением срока действия (через 1 час)
        setTimeout(authenticateWithTwitch, 55 * 60 * 1000);
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        showError('Ошибка подключения к Twitch API');
        
        // Повторная попытка через 1 минуту
        setTimeout(authenticateWithTwitch, 60 * 1000);
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
        
        if (!response.ok) {
            throw new Error('Ошибка получения информации о стримерах');
        }
        
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
        
        if (!response.ok) {
            throw new Error('Ошибка получения информации о стримах');
        }
        
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Ошибка получения информации о стримах:', error);
        return [];
    }
}

// Получение информации о прошлых стримах (видео)
async function getVideosInfo(logins, streamersInfo) {
    if (logins.length === 0) return {};
    
    try {
        const result = {};
        
        // Для каждого стримера получаем последние видео
        for (const login of logins) {
            const streamer = streamersInfo.find(s => s.login.toLowerCase() === login.toLowerCase());
            if (streamer) {
                const response = await fetch(`https://api.twitch.tv/helix/videos?user_id=${streamer.id}&type=archive&first=1`, {
                    headers: {
                        'Client-ID': CLIENT_ID,
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!response.ok) {
                    console.error(`Ошибка получения видео для ${login}`);
                    continue;
                }
                
                const data = await response.json();
                result[login] = data.data || [];
            }
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
        updateScroll();
        return;
    }
    
    try {
        // Обновляем время последнего обновления
        lastUpdateTime = Date.now();
        
        // Удаляем дубликаты перед загрузкой
        trackedStreamers = [...new Set(trackedStreamers)];
        
        const [streamersInfo, streamsInfo] = await Promise.all([
            getStreamersInfo(trackedStreamers),
            getStreamsInfo(trackedStreamers)
        ]);
        
        const videosInfo = await getVideosInfo(trackedStreamers, streamersInfo);
        
        await updateLastStreamsData(streamersInfo, streamsInfo, videosInfo);
        
        // Разделяем онлайн и оффлайн стримеров
        const onlineStreamers = trackedStreamers.filter(login => 
            streamsInfo.some(s => s.user_login.toLowerCase() === login.toLowerCase())
        );
        
        const offlineStreamers = trackedStreamers.filter(login => 
            !streamsInfo.some(s => s.user_login.toLowerCase() === login.toLowerCase())
        );
        
        // Получаем данные оффлайн стримеров из Firebase
        const offlineStreamersData = await Promise.all(
            offlineStreamers.map(async login => {
                const snapshot = await database.ref(`users/${userId}/streamersData/${login}`).once('value');
                return {
                    login,
                    data: snapshot.val() || {}
                };
            })
        );
        
        // Сортируем онлайн стримеров
        const sortedOnline = [...onlineStreamers].sort((a, b) => {
            const streamerA = streamersInfo.find(s => s.login.toLowerCase() === a.toLowerCase());
            const streamerB = streamersInfo.find(s => s.login.toLowerCase() === b.toLowerCase());
            const streamA = streamsInfo.find(s => s.user_login.toLowerCase() === a.toLowerCase());
            const streamB = streamsInfo.find(s => s.user_login.toLowerCase() === b.toLowerCase());
            
            switch(currentSort) {
                case 'name':
                    return streamerA.display_name.localeCompare(streamerB.display_name);
                case 'date':
                    return new Date(streamB.started_at) - new Date(streamA.started_at);
                case 'viewers':
                    return streamB.viewer_count - streamA.viewer_count;
                default:
                    return 0;
            }
        });
        
        // Сортируем оффлайн стримеров
        const sortedOffline = [...offlineStreamers].sort((a, b) => {
            const dataA = offlineStreamersData.find(s => s.login === a)?.data || {};
            const dataB = offlineStreamersData.find(s => s.login === b)?.data || {};
            const streamerA = streamersInfo.find(s => s.login.toLowerCase() === a.toLowerCase());
            const streamerB = streamersInfo.find(s => s.login.toLowerCase() === b.toLowerCase());
            
            switch(currentSort) {
                case 'name':
                    return streamerA.display_name.localeCompare(streamerB.display_name);
                case 'date':
                    const dateA = dataA.lastStreamDate || '';
                    const dateB = dataB.lastStreamDate || '';
                    return new Date(dateB) - new Date(dateA);
                case 'viewers':
                    const viewersA = dataA.viewerCount || 0;
                    const viewersB = dataB.viewerCount || 0;
                    return viewersB - viewersA;
                default:
                    return 0;
            }
        });
        
        // Объединяем отсортированные списки (онлайн всегда вверху)
        const sortedStreamers = [...sortedOnline, ...sortedOffline];
        
        // Сохраняем отсортированный список в базу данных
        await saveToFirebase('trackedStreamers', sortedStreamers);
        
        // Очищаем контейнер перед загрузкой
        streamersContainer.innerHTML = '';
        
        // Создаем карточки для всех стримеров
        for (const login of sortedStreamers) {
            const streamer = streamersInfo.find(s => s.login.toLowerCase() === login.toLowerCase());
            if (streamer) {
                const stream = streamsInfo.find(s => s.user_login.toLowerCase() === login.toLowerCase());
                const videos = videosInfo[login] || [];
                createStreamerCard(streamer, stream, videos);
            }
        }
        
        await checkForStatusChanges();
        updateScroll();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Ошибка обновления данных');
    }
}

// Обновление данных о последних стримах
async function updateLastStreamsData(streamersInfo, streamsInfo, videosInfo) {
    const now = new Date().toISOString();
    const updates = {};
    
    streamersInfo.forEach(streamer => {
        const login = streamer.login.toLowerCase();
        const stream = streamsInfo.find(s => s.user_login.toLowerCase() === login);
        const videos = videosInfo[login] || [];
        const lastVideo = videos[0];
        
        const streamerData = {
            userId: streamer.id,
            displayName: streamer.display_name,
            profileImageUrl: streamer.profile_image_url || "",
            lastChecked: now,
            lastStatus: stream ? 'online' : 'offline'
        };
        
        if (stream) {
            streamerData.lastStreamDate = stream.started_at || "";
            streamerData.lastStreamTitle = stream.title || "";
            streamerData.gameName = stream.game_name || "";
            streamerData.viewerCount = stream.viewer_count || 0;
            streamerData.thumbnailUrl = stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180') || "";
        } else if (lastVideo) {
            streamerData.lastStreamDate = lastVideo.created_at || "";
            streamerData.lastStreamTitle = lastVideo.title || "";
            streamerData.gameName = lastVideo.game_name || "";
            streamerData.duration = lastVideo.duration || "";
            streamerData.thumbnailUrl = lastVideo.thumbnail_url || "";
        }
        
        updates[`users/${userId}/streamersData/${login}`] = streamerData;
    });
    
    try {
        await database.ref().update(updates);
    } catch (error) {
        console.error('Ошибка обновления данных в Firebase:', error);
    }
}

function createStreamerCard(streamer, stream, videos) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 animate__animated animate__fadeIn';
    
    const isLive = !!stream;
    const login = streamer.login.toLowerCase();
    
    // Получаем данные из Firebase
    const streamerRef = database.ref(`users/${userId}/streamersData/${login}`);
    streamerRef.once('value').then(snapshot => {
        const streamerData = snapshot.val() || {};
        
        // Определяем данные для отображения
        const lastStreamDate = isLive ? stream.started_at : 
                            videos[0] ? videos[0].created_at : 
                            streamerData.lastStreamDate;
        
        const lastStreamTitle = isLive ? stream.title : 
                             videos[0] ? videos[0].title : 
                             streamerData.lastStreamTitle;
        
        const gameName = isLive ? stream.game_name : 
                        videos[0] ? videos[0].game_name : 
                        streamerData.gameName;
        
        const duration = videos[0] ? formatDuration(videos[0].duration) : 
                       streamerData.duration ? formatDuration(streamerData.duration) : 
                       null;

        // Определяем время с конца стрима (для оффлайн стримеров)
        let timeSinceEnd = '';
        if (!isLive && lastStreamDate) {
            const endTime = new Date(lastStreamDate);
            if (videos[0] && videos[0].duration) {
                // Добавляем длительность видео к времени начала
                const durationParts = videos[0].duration.match(/(\d+)h|(\d+)m|(\d+)s/g) || [];
                let durationMs = 0;
                
                durationParts.forEach(part => {
                    if (part.includes('h')) durationMs += parseInt(part) * 3600 * 1000;
                    if (part.includes('m')) durationMs += parseInt(part) * 60 * 1000;
                    if (part.includes('s')) durationMs += parseInt(part) * 1000;
                });
                
                endTime.setTime(endTime.getTime() + durationMs);
            }
            timeSinceEnd = getTimeSince(endTime.toISOString());
        }

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
                                    `<i class="far fa-clock me-1"></i> Последний стрим: ${formatDate(lastStreamDate)}${timeSinceEnd ? ` (был ${timeSinceEnd})` : ''}` :
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
    });
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
        // Добавляем индикатор загрузки
        addStreamerBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Проверка...';
        addStreamerBtn.disabled = true;
        
        const response = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка проверки стримера');
        }
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            showError('Стример не найден');
            return;
        }
        
        // Добавляем стримера и сохраняем
        trackedStreamers = [...new Set([...trackedStreamers, login])];
        await saveToFirebase('trackedStreamers', trackedStreamers);
        
        streamerInput.value = '';
        errorMessage.style.display = 'none';
        await loadTrackedStreamers();
        
        // Показываем уведомление об успешном добавлении
        notificationToast.show();
    } catch (error) {
        console.error('Ошибка при добавлении стримера:', error);
        showError('Ошибка при добавлении стримера');
    } finally {
        addStreamerBtn.innerHTML = '<i class="fas fa-plus me-2"></i> Добавить';
        addStreamerBtn.disabled = false;
    }
}

// Удаление стримера
async function removeStreamer(login) {
    trackedStreamers = trackedStreamers.filter(l => l.toLowerCase() !== login.toLowerCase());
    await saveToFirebase('trackedStreamers', trackedStreamers);
    
    // Удаляем данные стримера из Firebase
    try {
        await database.ref(`users/${userId}/streamersData/${login.toLowerCase()}`).remove();
        await database.ref(`users/${userId}/notifications/${login.toLowerCase()}`).remove();
    } catch (error) {
        console.error('Ошибка удаления данных стримера:', error);
    }
    
    loadTrackedStreamers();
}

// Удаление всех стримеров
async function deleteAllStreamers() {
    trackedStreamers = [];
    await saveToFirebase('trackedStreamers', trackedStreamers);
    
    // Удаляем все данные стримеров из Firebase
    try {
        await database.ref(`users/${userId}/streamersData`).remove();
        await database.ref(`users/${userId}/notifications`).remove();
    } catch (error) {
        console.error('Ошибка удаления данных стримеров:', error);
    }
    
    loadTrackedStreamers();
}

// Проверка изменений статуса для уведомлений
async function checkForStatusChanges() {
    try {
        const previousDataSnapshot = await database.ref(`users/${userId}/previousStreamersData`).once('value');
        const previousData = previousDataSnapshot.val() || {};
        
        const currentDataSnapshot = await database.ref(`users/${userId}/streamersData`).once('value');
        const currentData = currentDataSnapshot.val() || {};
        
        for (const login in currentData) {
            const currentStatus = currentData[login]?.lastStatus;
            const previousStatus = previousData[login]?.lastStatus;
            const streamerName = currentData[login]?.displayName || login;
            const currentGame = currentData[login]?.gameName || 'Unknown Game';
            const previousGame = previousData[login]?.gameName || 'Unknown Game';
            const currentTitle = currentData[login]?.lastStreamTitle || 'No title';
            const previousTitle = previousData[login]?.lastStreamTitle || 'No title';
            const currentViewers = currentData[login]?.viewerCount || 0;
            const previousViewers = previousData[login]?.viewerCount || 0;
            const streamStart = currentData[login]?.lastStreamDate;
            const thumbnailUrl = currentData[login]?.thumbnailUrl || '';
            
            // Получаем данные уведомления из Firebase
            const notificationRef = database.ref(`users/${userId}/notifications/${login}`);
            const notificationSnapshot = await notificationRef.once('value');
            let notificationData = notificationSnapshot.val() || {};
            
            // Если статус изменился
            if (currentStatus && previousStatus && currentStatus !== previousStatus) {
                if (currentStatus === 'online') {
                    // Отправляем новое уведомление о начале стрима
                    const message = `🟢 *${streamerName} начал стрим!*\n\n` +
                                   `📺 *Название:* ${currentTitle}\n` +
                                   `🎮 *Категория:* ${currentGame}\n` +
                                   `👥 *Зрителей:* ${formatNumber(currentViewers)}\n` +
                                   `⏱ *Длительность:* ${formatStreamDuration(streamStart)}\n\n` +
                                   `[Смотреть на Twitch](https://twitch.tv/${login})`;
                    
                    const response = await sendTelegramNotification(message);
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Сохраняем данные уведомления в Firebase
                        notificationData = {
                            messageId: data.result.message_id,
                            peakViewers: currentViewers,
                            lastGame: currentGame,
                            lastTitle: currentTitle,
                            lastStatus: 'online',
                            thumbnailUrl: thumbnailUrl
                        };
                        
                        await notificationRef.set(notificationData);
                    }
                } else if (currentStatus === 'offline') {
                    // Удаляем предыдущее уведомление, если оно есть
                    if (notificationData.messageId) {
                        await deleteTelegramNotification(notificationData.messageId);
                    }
                    
                    // Получаем информацию о последнем стриме
                    const videosResponse = await fetch(`https://api.twitch.tv/helix/videos?user_id=${currentData[login].userId}&type=archive&first=1`, {
                        headers: {
                            'Client-ID': CLIENT_ID,
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    
                    const videosData = await videosResponse.json();
                    const lastVideo = videosData.data?.[0];
                    const duration = lastVideo?.duration ? formatDuration(lastVideo.duration) : 'неизвестно';
                    const finalTitle = lastVideo?.title || notificationData.lastTitle || currentTitle;
                    const finalGame = lastVideo?.game_name || notificationData.lastGame || currentGame;
                    const peakViewers = notificationData.peakViewers || previousViewers;
                    const finalThumbnail = lastVideo?.thumbnail_url || notificationData.thumbnailUrl || '';
                    
                    // Отправляем новое уведомление о завершении
                    const message = `🔴 *${streamerName} закончил стрим*\n\n` +
                                   `📺 *Название:* ${finalTitle}\n` +
                                   `🎮 *Категория:* ${finalGame}\n` +
                                   `⏱ *Длительность:* ${duration}\n` +
                                   `👥 *Макс. зрителей:* ${formatNumber(peakViewers)}\n\n` +
                                   `[Канал на Twitch](https://twitch.tv/${login})`;
                    
                    await sendTelegramNotification(message);
                    
                    // Удаляем данные уведомления из Firebase
                    await notificationRef.remove();
                }
            } 
            // Если стрим продолжается и есть изменения
            else if (currentStatus === 'online' && previousStatus === 'online') {
                const titleChanged = currentTitle !== previousTitle;
                const gameChanged = currentGame !== previousGame;
                const viewersChanged = currentViewers !== previousViewers;
                
                // Обновляем пиковое количество зрителей
                if (notificationData && currentViewers > (notificationData.peakViewers || 0)) {
                    notificationData.peakViewers = currentViewers;
                    await notificationRef.update({ peakViewers: currentViewers });
                }
                
                // Если есть значительные изменения (название, категория или зрители)
                if (titleChanged || gameChanged || viewersChanged) {
                    // Обновляем последние данные
                    if (notificationData) {
                        const updates = {};
                        if (titleChanged) updates.lastTitle = currentTitle;
                        if (gameChanged) updates.lastGame = currentGame;
                        if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;
                        
                        if (Object.keys(updates).length > 0) {
                            await notificationRef.update(updates);
                        }
                    }
                    
                    // Редактируем существующее сообщение
                    if (notificationData?.messageId) {
                        const message = `🟢 *${streamerName} в эфире!*\n\n` +
                                       `📺 *Название:* ${currentTitle}\n` +
                                       `🎮 *Категория:* ${currentGame}\n` +
                                       `👥 *Зрителей:* ${formatNumber(currentViewers)}\n` +
                                       `⏱ *Длительность:* ${formatStreamDuration(streamStart)}\n\n` +
                                       `[Смотреть на Twitch](https://twitch.tv/${login})`;
                        
                        await editTelegramNotification(notificationData.messageId, message);
                    }
                }
            }
        }
        
        // Сохраняем текущие данные для следующей проверки
        await database.ref(`users/${userId}/previousStreamersData`).set(currentData);
    } catch (error) {
        console.error('Ошибка проверки изменений статуса:', error);
    }
}

// Функция редактирования сообщения в Telegram
async function editTelegramNotification(messageId, newText) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                message_id: messageId,
                text: newText,
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка редактирования уведомления');
        }
    } catch (error) {
        console.error('Ошибка редактирования уведомления:', error);
    }
}

// Функция удаления сообщения в Telegram
async function deleteTelegramNotification(messageId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                message_id: messageId
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка удаления уведомления');
        }
    } catch (error) {
        console.error('Ошибка удаления уведомления:', error);
    }
}

// Функция отправки уведомления в Telegram
async function sendTelegramNotification(message) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            })
        });
        
        return response;
    } catch (error) {
        console.error('Ошибка отправки уведомления в Telegram:', error);
        return { ok: false };
    }
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

// Получение времени с последнего стрима (или его окончания)
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
    
    if (years > 0) return `${years} г. назад`;
    if (months > 0) return `${months} мес. назад`;
    if (days > 0) return `${days} д. назад`;
    if (hours > 0) return `${hours} ч. назад`;
    if (minutes > 0) return `${minutes} мин. назад`;
    return `${seconds} сек. назад`;
}

// Форматирование чисел (для количества зрителей)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Управление скроллом страницы
function updateScroll() {
    if (trackedStreamers.length > 4) {
        document.body.style.overflowY = 'auto';
    } else {
        document.body.style.overflowY = 'hidden';
    }
}
