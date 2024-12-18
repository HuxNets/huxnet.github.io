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
    // Получение элементов
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
    const downloadImagesBtn = document.getElementById('download-images-btn');
    const downloadTextBtn = document.getElementById('download-text-btn');

    // Администраторские данные
    const adminCredentials = {
        username: 'huxnet',
        password: 'dimon131'
    };

    let currentUser = null;
    let uploads = [];

    // Класс для управления загрузками
    class UploadManager {
        // Сохранение загрузки
        static saveUpload(upload) {
            const uploadsRef = database.ref('uploads');
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

    // Функция для отображения загрузок
    function renderUploads(uploadsList) {
        uploads = uploadsList;
        const uploadsContainer = document.getElementById('uploads-list');
        uploadsContainer.innerHTML = '';

        uploadsList.forEach(upload => {
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

            uploadsContainer.appendChild(uploadItem);
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
