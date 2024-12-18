// Конфигурация Firebase (из консоли Firebase)
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
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
    const resetUserLimitsBtn = document.getElementById('reset-user-limits-btn');
    const disableImageUploadCheckbox = document.getElementById('disable-image-upload');
    const disableTextUploadCheckbox = document.getElementById('disable-text-upload');
    const photoLimitInput = document.getElementById('photo-limit-input');
    const textLimitInput = document.getElementById('text-limit-input');
    const applyLimitsBtn = document.getElementById('apply-limits-btn');
    const downloadImagesBtn = document.getElementById('download-images-btn');
    const downloadTextBtn = document.getElementById('download-text-btn');

    // Администраторские credentials
    const adminCredentials = {
        username: 'huxnet',
        password: 'dimon131'
    };

    let currentUser = null;
    let uploads = [];
    let userLimits = {};
    let photoLimit = 10; // Значение по умолчанию
    let textLimit = 10; // Значение по умолчанию

    // Класс для управления загрузками
    class UploadManager {
        // Сохранение загрузки
        static saveUpload(upload) {
            const uploadsRef = database.ref('uploads');
            const newUploadRef = uploadsRef.push();
            
            return newUploadRef.set({
                type: upload.type,
                content: upload.content,
                user: upload.user,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }

        // Получение всех загрузок
        static getAllUploads(callback) {
            const uploadsRef = database.ref('uploads');
            
            uploadsRef.on('value', (snapshot) => {
                const uploads = [];
                snapshot.forEach((childSnapshot) => {
                    const upload = childSnapshot.val();
                    upload.id = childSnapshot.key;
                    uploads.push(upload);
                });
                
                callback(uploads);
            });
        }

        // Удаление всех загрузок
        static resetUploads() {
            return database.ref('uploads').remove();
        }

        // Сохранение лимитов
        static saveLimits(limits) {
            return database.ref('limits').set(limits);
        }

        // Получение лимитов
        static getLimits(callback) {
            const limitsRef = database.ref('limits');
            limitsRef.once('value', (snapshot) => {
                callback(snapshot.val() || {
                    photoLimit: 10,
                    textLimit: 10
                });
            });
        }
    }

    // Инициализация при входе
    function initializeApp() {
        // Получаем лимиты
        UploadManager.getLimits((limits) => {
            photoLimit = limits.photoLimit;
            textLimit = limits.textLimit;
            photoLimitInput.value = photoLimit;
            textLimitInput.value = textLimit;
        });

        // Загрузка и отображение uploads
        UploadManager.getAllUploads((loadedUploads) => {
            uploads = loadedUploads;
            renderUploads(uploads);
        });
    }

    // Рендер загрузок
    function renderUploads(uploads) {
        uploadsList.innerHTML = '';
        uploads.sort((a, b) => b.timestamp - a.timestamp)
            .forEach(upload => {
                const uploadItem = document.createElement('div');
                uploadItem.classList.add('upload-item');

                const userSpan = document.createElement('span');
                userSpan.textContent = `От: ${upload.user}`;
                uploadItem.appendChild(userSpan);

                if (upload.type === 'image') {
                    const img = document.createElement('img');
                    img.src = upload.content;
                    uploadItem.appendChild(img);
                } else {
                    const textContent = document.createElement('p');
                    textContent.textContent = upload.content;
                    uploadItem.appendChild(textContent);
                }

                uploadsList.appendChild(uploadItem);
            });
    }

    // Вход пользователя
    loginBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim().toLowerCase();

        if (!username) {
            alert('Введите имя пользователя');
            return;
        }

        // Проверка администратора
        if (username === adminCredentials.username) {
            passwordInput.classList.remove('hidden');
            if (passwordInput.value === adminCredentials.password) {
                currentUser = username;
                loginContainer.classList.add('hidden');
                mainContainer.classList.remove('hidden');
                adminSection.classList.remove('hidden');
                initializeApp();
                alert('Вход выполнен как администратор');
            } else if (passwordInput.value !== '') {
                alert('Неверный пароль');
            }
        } else {
            // Вход обычного пользователя
            currentUser = username;
            loginContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            initializeApp();
            alert(`Добро пожаловать, ${currentUser}`);
        }
    });

    // Загрузка фото
    uploadPhotoBtn.addEventListener('click', () => {
        if (disableImageUploadCheckbox.checked) {
            alert('Загрузка изображений отключена администратором');
            return;
        }

        photoInput.click();
    });

    photoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                UploadManager.saveUpload({
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
        if (disableTextUploadCheckbox.checked) {
            alert('Отправка текста отключена администратором');
            return;
        }

        const text = textInput.value.trim();
        if (text) {
            UploadManager.saveUpload({
                type: 'text',
                content: text,
                user: currentUser
            });
            textInput.value = '';
        }
    });

   // Сброс загрузок
    resetUploadsBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить все загрузки?')) {
            UploadManager.resetUploads();
            alert('Все загрузки были сброшены.');
        }
    });

    // Сброс лимитов
    resetUserLimitsBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить лимиты для всех пользователей?')) {
            // Сброс лимитов до значений по умолчанию
            const defaultLimits = {
                photoLimit: 10,
                textLimit: 10
            };
            UploadManager.saveLimits(defaultLimits);
            photoLimit = defaultLimits.photoLimit;
            textLimit = defaultLimits.textLimit;
            photoLimitInput.value = photoLimit;
            textLimitInput.value = textLimit;
            alert('Лимиты пользователей были сброшены.');
        }
    });

    // Применение лимитов
    applyLimitsBtn.addEventListener('click', () => {
        const newPhotoLimit = parseInt(photoLimitInput.value);
        const newTextLimit = parseInt(textLimitInput.value);

        if (isNaN(newPhotoLimit) || isNaN(newTextLimit)) {
            alert('Введите корректные числовые значения');
            return;
        }

        const newLimits = {
            photoLimit: newPhotoLimit,
            textLimit: newTextLimit
        };

        UploadManager.saveLimits(newLimits);
        photoLimit = newPhotoLimit;
        textLimit = newTextLimit;
        alert(`Новые лимиты: Фото - ${photoLimit}, Тексты - ${textLimit}`);
    });

    // Скачивание изображений
    downloadImagesBtn.addEventListener('click', () => {
        const imageUploads = uploads.filter(item => item.type === 'image');

        if (imageUploads.length === 0) {
            alert('Нет изображений для скачивания.');
            return;
        }

        // Создание zip-архива
        const zip = new JSZip();
        
        imageUploads.forEach((image, index) => {
            // Извлечение base64 данных
            const base64Data = image.content.split(',')[1];
            zip.file(`${image.user}-${index + 1}.png`, base64Data, { base64: true });
        });

        // Генерация и скачивание архива
        zip.generateAsync({ type: 'blob' }).then((content) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'images.zip';
            a.click();
        });
    });

    // Скачивание текстов
    downloadTextBtn.addEventListener('click', () => {
        const textUploads = uploads.filter(item => item.type === 'text');
        
        if (textUploads.length === 0) {
            alert('Нет текстов для скачивания.');
            return;
        }

        // Формирование текстового контента
        const texts = textUploads.map(item => `${item.user}: ${item.content}`).join('\n');
        
        // Создание и скачивание текстового файла
        const blob = new Blob([texts], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'texts.txt';
        a.click();
    });
});

// Функция для проверки и ограничения загрузок
function checkUploadLimits(user, type) {
    // Здесь можно добавить логику проверки лимитов
    // Например, подсчет количества загрузок пользователя
    const userUploads = uploads.filter(upload => 
        upload.user === user && upload.type === type
    );

    if (type === 'image' && userUploads.length >= photoLimit) {
        alert(`Вы достигли лимита в ${photoLimit} изображений`);
        return false;
    }

    if (type === 'text' && userUploads.length >= textLimit) {
        alert(`Вы достигли лимита в ${textLimit} текстовых сообщений`);
        return false;
    }

    return true;
}
