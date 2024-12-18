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
    // Получение всех элементов
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

    // Администраторские данные
    const adminCredentials = {
        username: 'huxnet',
        password: 'dimon131'
    };

    let currentUser = null;
    let uploads = [];
    let globalSettings = {
        photoLimit: 3,
        textLimit: 3,
        imageUploadDisabled: false,
        textUploadDisabled: false
    };

    // Класс управления загрузками
    class UploadManager {
        // Сохранение глобальных настроек
        static saveGlobalSettings(settings) {
            return database.ref('globalSettings').set(settings);
        }

        // Получение глобальных настроек
        static initGlobalSettingsListener(callback) {
            const settingsRef = database.ref('globalSettings');
            settingsRef.on('value', (snapshot) => {
                const settings = snapshot.val() || globalSettings;
                callback(settings);
            });
        }

        // Сохранение загрузки
        static saveUpload(upload) {
            const uploadsRef = database.ref('uploads');
            
            // Проверка глобальных ограничений
            if (globalSettings.imageUploadDisabled && upload.type === 'image') {
                alert('Загрузка изображений запрещена');
                return false;
            }

            if (globalSettings.textUploadDisabled && upload.type === 'text') {
                alert('Загрузка текста запрещена');
                return false;
            }

            // Проверка лимитов для пользователя
            const userUploads = uploads.filter(u => 
                u.user === upload.user && u.type === upload.type
            );

            const limit = upload.type === 'image' ? globalSettings.photoLimit : globalSettings.textLimit;

            if (userUploads.length >= limit) {
                alert(`Достигнут лимит ${limit} ${upload.type === 'image' ? 'фото' : 'текстов'}`);
                return false;
            }

            return uploadsRef.push(upload);
        }

        // Получение всех загрузок
        static initUploadsListener(callback) {
            const uploadsRef = database.ref('uploads');
            uploadsRef.on('value', (snapshot) => {
                const uploadsData = snapshot.val();
                const uploadsList = uploadsData ? Object.values(uploadsData) : [];
                callback(uploadsList);
            });
        }

        // Сброс всех загрузок
        static resetUploads() {
            return database.ref('uploads').remove();
        }
    }

    // Инициализация настроек
    UploadManager.initGlobalSettingsListener((settings) => {
        globalSettings = settings;
        photoLimitInput.value = settings.photoLimit;
        textLimitInput.value = settings.textLimit;
        disableImageUploadCheckbox.checked = settings.imageUploadDisabled;
        disableTextUploadCheckbox.checked = settings.textUploadDisabled;
    });

    // Рендер загрузок
    function renderUploads(uploadList) {
        uploads = uploadList;
        uploadsList.innerHTML = ''; // Очищаем список загрузок

        uploadList.forEach(upload => {
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

    // Инициализация прослушивателя загрузок
    UploadManager.initUploadsListener(renderUploads);

    // Обработчик входа
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
                alert('Вход выполнен как администратор');
            } else if (passwordInput.value !== '') {
                alert('Неверный пароль');
            }
        } else {
            // Вход обычного пользователя
            currentUser = username;
            loginContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
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
        } else {
            alert('Введите текст');
        }
    });

    // Сброс всех загрузок
    resetUploadsBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить все загрузки?')) {
            UploadManager.resetUploads();
            alert('Все загрузки были сброшены.');
        }
    });

    // Скачивание изображений
    downloadImagesBtn.addEventListener('click', () => {
        const imageUploads = uploads.filter(item => item.type === 'image');

        if (imageUploads.length === 0) {
            alert('Нет изображений для скачивания.');
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
    });

    // Скачивание текстов
    downloadTextBtn.addEventListener('click', () => {
        const textUploads = uploads.filter(item => item.type === 'text');
        
        if (textUploads.length === 0) {
            alert('Нет текстов для скачивания.');
            return;
        }

        const texts = textUploads.map(item => `${item.user}: ${item.content}`).join('\n');
        
        const blob = new Blob([texts], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'texts.txt';
        a.click();
    });
});

// Функция для проверки лимитов загрузок (необязательно)
function checkUploadLimits(uploads, user, type, limit) {
    const userUploads = uploads.filter(upload => 
        upload.user === user && upload.type === type
    );

    return userUploads.length < limit;
}

 applyLimitsBtn.addEventListener('click', () => {
        const newSettings = {
            photoLimit: parseInt(photoLimitInput.value),
            textLimit: parseInt(textLimitInput.value),
            imageUploadDisabled: disableImageUploadCheckbox.checked,
            textUploadDisabled: disableTextUploadCheckbox.checked
        };

        UploadManager.saveGlobalSettings(newSettings);
        alert('Настройки обновлены');
    });
