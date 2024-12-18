<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Пользовательская панель</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="login-container">
        <h1>Вход</h1>
        <input type="text" id="username" placeholder="Введите имя пользователя">
        <input type="password" id="password" placeholder="Введите пароль" class="hidden">
        <button id="login-btn">Вход</button>
    </div>

    <div class="container hidden">
        <div class="user-content">
            <h1>Загрузки пользователей</h1>
            <div id="uploads-list"></div>
        </div>

        <div class="user-panel">
            <h1>Панель пользователя</h1>
            <div id="user-options">
                <button id="upload-photo-btn">Загрузить фото</button>
                <input type="file" id="photo-input" accept="image/*" class="hidden">
                <textarea id="text-input" rows="4" placeholder="Введите текст"></textarea>
                <button id="add-text-btn">Добавить текст</button>
            </div>
            
            <div id="admin-section" class="hidden">
                <h1>Админ Панель</h1>
                <div id="admin-options">
                    <button id="download-images-btn">Скачать все изображения</button>
                    <button id="download-text-btn">Скачать все тексты</button>
                    <button id="reset-uploads-btn">Сбросить все загрузки</button>

                    <div>
                        <label>
                            <input type="checkbox" id="disable-image-upload"> Запретить загрузку изображений
                        </label>
                    </div>
                    <div>
                        <label>
                            <input type="checkbox" id="disable-text-upload"> Запретить отправку текста
                        </label>
                    </div>
                    <div>
                        <label>Ограничение на загрузку фото (макс): </label>
                        <input type="number" id="photo-limit-input" value="3" min="1">
                    </div>
                    <div>
                        <label>Ограничение на загрузку текстов (макс): </label>
                        <input type="number" id="text-limit-input" value="3" min="1">
                    </div>
                    <button id="apply-limits-btn">Применить ограничения</button>
                </div>
            </div>
        </div>
    </div>

    <script type="module">
        // Импорт Firebase
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
        import { getDatabase, ref, set, push, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

        // Конфигурация Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyDHliWG6J_6iTarmqIMnrBjAjNSG0MPihk",
            authDomain: "huxtextigm.firebaseapp.com",
            projectId: "huxtextigm",
            storageBucket: "huxtextigm.firebasestorage.app",
            messagingSenderId: "496908406007",
            appId: "1:496908406007:web:dbbfb8d24b1a286daf57f2"
        };

        // Инициализация Firebase
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);

        // Администраторские данные
        const ADMIN_USERNAME = 'huxnet';
        const ADMIN_PASSWORD = 'dimon131';

        // Элементы интерфейса
        const loginBtn = document.getElementById('login-btn');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginContainer = document.querySelector('.login-container');
        const mainContainer = document.querySelector('.container');
        const uploadsList = document.getElementById('uploads-list');
        const photoInput = document.getElementById('photo-input');
        const uploadPhotoBtn = document.getElementById('upload-photo-btn');
        const textInput = document.getElementById('text-input');
        const addTextBtn = document.getElementById('add-text-btn');
        const adminSection = document.getElementById('admin-section');
        const resetUploadsBtn = document.getElementById('reset-uploads-btn');
        const disableImageUploadCheckbox = document.getElementById('disable-image-upload');
        const disableTextUploadCheckbox = document.getElementById('disable-text-upload');
        const photoLimitInput = document.getElementById('photo-limit-input');
        const textLimitInput = document.getElementById('text-limit-input');
        const applyLimitsBtn = document.getElementById('apply-limits-btn');
        const downloadImagesBtn = document.getElementById('download-images-btn');
        const downloadTextBtn = document.getElementById('download-text-btn');

        let currentUser = null;
        let globalSettings = {
            photoLimit: 3,
            textLimit: 3,
            imageUploadDisabled: false,
            textUploadDisabled: false
        };

        // Функция входа
        function login() {
            const username = usernameInput.value.trim().toLowerCase();
            
            if (!username) {
                alert('Введите имя пользователя');
                return;
            }

            if (username === ADMIN_USERNAME) {
                passwordInput.classList.remove('hidden');
                if (passwordInput.value === ADMIN_PASSWORD) {
                    currentUser = username;
                    loginContainer.classList.add('hidden');
                    mainContainer.classList.remove('hidden');
                    adminSection.classList.remove('hidden');
                    alert('Вход как администратор');
                } else {
                    alert('Неверный пароль');
                }
            } else {
                currentUser = username;
                loginContainer.classList.add('hidden');
                mainContainer.classList.remove('hidden');
                alert(`Добро пожаловать, ${currentUser}`);
            }
        }

        // Сохранение загрузки
        function saveUpload(upload) {
            const uploadsRef = ref(database, 'uploads');
            push(uploadsRef, upload);
        }

        // Получение загрузок
        function initUploadsListener() {
            const uploadsRef = ref(database, 'uploads');
            onValue(uploadsRef, (snapshot) => {
                const data = snapshot.val();
                renderUploads(data ? Object.values(data) : []);
            });
        }

        // Рендер загрузок
        function renderUploads(uploads) {
            uploadsList.innerHTML = '';
            uploads.forEach(upload => {
                const uploadItem = document.createElement('div');
                uploadItem.classList.add('upload-item');

                const userSpan = document.createElement('div');
                userSpan.classList.add('username');
                userSpan.textContent = upload.user;

                if (upload.type === 'image') {
                    const img = document.createElement('img');
                    img.src = upload.content;
                    uploadItem.appendChild(userSpan);
                    uploadItem.appendChild(img);
                } else if (upload.type === 'text') {
                    const textContent = document.createElement('p');
                    textContent.classList.add('text-content');
                    textContent.textContent = upload.content;
                    uploadItem.appendChild(userSpan);
                    uploadItem.appendChild(textContent);
                }

                uploadsList.appendChild(uploadItem);
            });
        }

        // Сохранение глобальных настроек
        function saveGlobalSettings(settings) {
            const settingsRef = ref(database, 'globalSettings');
            set(settingsRef, settings);
        }

        // Получение глобальных настроек
        function initGlobalSettingsListener() {
            const settingsRef = ref(database, 'globalSettings');
            onValue(settingsRef, (snapshot) => {
                const settings = snapshot.val() || globalSettings;
                globalSettings = settings;
                updateSettingsUI(settings);
            });
        }

        // Обновление UI настроек
        function updateSettingsUI(settings) {
            photoLimitInput.value = settings.photoLimit;
            textLimitInput.value = settings.textLimit;
            disableImageUploadCheckbox.checked = settings.imageUploadDisabled;
            disableTextUploadCheckbox.checked = settings.textUploadDisabled;
        }

        // Обработчики событий
        loginBtn.addEventListener('click', login);

        // Загрузка фото
        uploadPhotoBtn.addEventListener('click', () => {
            if (globalSettings.imageUploadDisabled) {
                alert('Загрузка изображений запрещена');
                return;
            }
            photoInput.click();
        });

        photoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    saveUpload({
                        type: 'image',
                        content: e.target.result,
                        user: currentUser
                    });
                };
                reader.readAsDataURL(file);
            }
        });

        // Добавление текста
        addTextBtn.addEventListener('click', () => {
            if (globalSettings.textUploadDisabled) {
                alert('Отправка текста запрещена');
                return;
            }

            const text = textInput.value.trim();
            if (text) {
                saveUpload({
                    type: 'text',
                    content: text,
                    user: currentUser
                });
                textInput.value = '';
            } else {
                alert('Введите текст');
            }
        });

        // Сброс загрузок
        resetUploadsBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите сбросить все загрузки?')) {
                const uploadsRef = ref(database, 'uploads');
                remove(uploadsRef);
                alert('Все загрузки сброшены');
            }
        });

        // Применение настроек
        applyLimitsBtn.addEventListener('click', () => {
            const newSettings = {
                photoLimit: parseInt(photoLimitInput.value),
                textLimit: parseInt(textLimitInput.value),
                imageUploadDisabled: disableImageUploadCheckbox.checked,
                textUploadDisabled: disableTextUploadCheckbox.checked
            };

            saveGlobalSettings(newSettings);
            alert('Настройки обновлены');
        });

        // Скачивание изображений
        downloadImagesBtn.addEventListener('click', () => {
            const uploadsRef = ref(database, 'uploads');
            onValue(uploadsRef, (snapshot) => {
                const data = snapshot.val();
                const uploads = data ? Object.values(data) : [];
                const imageUploads = uploads.filter(item => item.type === 'image');

                if (imageUploads.length === 0) {
                    alert('Нет изображений для скачивания');
                    return;
                }

                const zip = new JSZip();
                imageUploads.forEach((image, index) => {
                    zip.file(`${image.user}-${index + 1}.png`, image.content.split(',')[1], { base64: true });
                });

                zip.generateAsync({ type: 'blob' }).then((content) => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(content);
                    a.download = 'images.zip';
                    a.click();
                });
            }, { onlyOnce: true });
        });

        // Скачивание текстов
        downloadTextBtn.addEventListener('click', () => {
            const uploadsRef = ref(database, 'uploads');
            onValue(uploadsRef, (snapshot) => {
                const data = snapshot.val();
                const uploads = data ? Object.values(data) : [];
                const textUploads = uploads.filter(item => item.type === 'text');

                if (textUploads.length === 0) {
                    alert('Нет текстов для скачивания');
                    return;
                }

                const texts = textUploads.map(item => `${item.user}: ${item.content}`).join('\n');
                const blob = new Blob([texts], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'texts.txt';
                a.click();
            }, { onlyOnce: true });
        });

        // Инициализация
        initUploadsListener();
        initGlobalSettingsListener();
    </script>
</body>
</html>
