document.addEventListener('DOMContentLoaded', async () => {
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

    // Настройки для GitHub
    const GITHUB_TOKEN = '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'; // Вставьте ваш токен
    const GITHUB_REPO = 'HuxNets/user-uploads'; // Репозиторий (замените на свой)
    const FILE_PATH = 'uploads.json'; // Путь к файлу в репозитории

    const adminCredentials = {
        username: 'huxnet',
        password: 'dimon131'
    };

    let currentUser = null;
    let uploads = []; // Будем загружать данные с GitHub
    let userLimits = JSON.parse(localStorage.getItem('userLimits')) || {};
    let photoLimit = parseInt(photoLimitInput.value);
    let textLimit = parseInt(textLimitInput.value);
    let userUploadCounts = {}; // Счетчик для фото

    // Функция для загрузки данных с GitHub
    async function loadUploadsFromGitHub() {
        const apiUrl = `https://api.github.com/repos/HuxNets/user-uploads/contents/uploads.json`;

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            });

            if (response.ok) {
                const fileData = await response.json();
                const content = atob(fileData.content); // Раскодируем base64
                return JSON.parse(content); // Возвращаем JSON
            } else if (response.status === 404) {
                console.log('Файл отсутствует, создаем новый.');
                return [];
            } else {
                console.error('Ошибка загрузки данных с GitHub:', response.status, await response.json());
                return [];
            }
        } catch (err) {
            console.error('Ошибка запроса к GitHub:', err);
            return [];
        }
    }

    // Функция для обновления файла на GitHub
    async function updateGitHubFile(content) {
        const apiUrl = `https://api.github.com/repos/HuxNets/user-uploads/contents/uploads.json`;

        try {
            const getFileResponse = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            });

            let sha = null;
            if (getFileResponse.ok) {
                const fileData = await getFileResponse.json();
                sha = fileData.sha; // Текущий SHA файла
            }

            const updatedData = {
                message: 'Обновление данных о загрузках',
                content: btoa(JSON.stringify(content, null, 2)), // Данные в base64
                sha: sha // Обновляем по текущему SHA (если файл существовал)
            };

            const updateResponse = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                },
                body: JSON.stringify(updatedData)
            });

            if (updateResponse.ok) {
                console.log('Файл успешно обновлен на GitHub');
            } else {
                console.error('Ошибка обновления файла на GitHub:', await updateResponse.json());
            }
        } catch (err) {
            console.error('Ошибка при обновлении файла на GitHub:', err);
        }
    }

    // Сохранение данных на GitHub
    async function saveUploads() {
        await updateGitHubFile(uploads);
    }

    // Загрузка данных при старте
    async function loadUploads() {
        uploads = await loadUploadsFromGitHub();
        updateUploads();
    }

    // Функция для отображения фотографий и текстов пользователей
    function updateUploads() {
        uploadsList.innerHTML = '';
        uploads.forEach((upload) => {
            const listItem = document.createElement('div');
            listItem.classList.add('upload-item');

            const usernameDisplay = document.createElement('div');
            usernameDisplay.classList.add('username');
            usernameDisplay.textContent = upload.user;

            if (upload.type === 'image') {
                const img = document.createElement('img');
                img.src = upload.content;
                listItem.appendChild(usernameDisplay);
                listItem.appendChild(img);
            } else if (upload.type === 'text') {
                const textContent = document.createElement('p');
                textContent.classList.add('text-content');
                textContent.textContent = upload.content;
                listItem.appendChild(usernameDisplay);
                listItem.appendChild(textContent);
            }

            uploadsList.appendChild(listItem);
        });
    }

    // Вход пользователя или администратора
    loginBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim().toLowerCase();

        if (!username) {
            alert('Введите имя пользователя');
            return;
        }

        // Если это админ
        if (username === adminCredentials.username) {
            passwordInput.classList.remove('hidden'); // Показываем поле для пароля
            if (passwordInput.value === adminCredentials.password) {
                currentUser = username;
                loginContainer.classList.add('hidden');
                mainContainer.classList.remove('hidden');
                adminSection.classList.remove('hidden'); // Показываем админ панель
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
            updateUploads();
        }
    });

    // Загрузка фото
    uploadPhotoBtn.addEventListener('click', () => {
        if (disableImageUploadCheckbox.checked) {
            alert('Загрузка изображений отключена администратором');
            return;
        }

        if (!userLimits[currentUser]) userLimits[currentUser] = { photoCount: 0, textCount: 0 };

        if (userLimits[currentUser].photoCount >= photoLimit) {
            alert(`Вы достигли предела загрузки в ${photoLimit} фото.`);
            return;
        }

        photoInput.click();
    });

    photoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                uploads.push({
                    type: 'image',
                    content: e.target.result,
                    user: currentUser
                });

                userLimits[currentUser].photoCount++;
                await saveUploads();
                updateUploads();
            };
            reader.readAsDataURL(file);
        }
    });

    // Добавление текста
    addTextBtn.addEventListener('click', async () => {
        if (disableTextUploadCheckbox.checked) {
            alert('Отправка текста отключена администратором');
            return;
        }

        if (!userLimits[currentUser]) userLimits[currentUser] = { photoCount: 0, textCount: 0 };

        if (userLimits[currentUser].textCount >= textLimit) {
            alert(`Вы достигли предела загрузки в ${textLimit} текстов.`);
            return;
        }

        const text = textInput.value.trim();
        if (text) {
            uploads.push({
                type: 'text',
                content: text,
                user: currentUser
            });

            userLimits[currentUser].textCount++;
            textInput.value = '';
            await saveUploads();
            updateUploads();
        } else {
            alert('Введите текст');
        }
    });

    // Сброс всех загрузок
    resetUploadsBtn.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите сбросить все загрузки?')) {
            uploads = [];
            await saveUploads(); // Сохраняем пустой массив на GitHub
            updateUploads();
            alert('Все загрузки были сброшены.');
        }
    });

    // Сброс лимитов для всех пользователей
    resetUserLimitsBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить лимиты для всех пользователей?')) {
            userLimits = {};
            localStorage.setItem('userLimits', JSON.stringify(userLimits));
            alert('Лимиты пользователей были сброшены.');
        }
    });

    // Скачивание всех изображений админом
    downloadImagesBtn.addEventListener('click', () => {
        const zip = new JSZip();
        const imageUploads = uploads.filter(item => item.type === 'image');

        if (imageUploads.length === 0) {
            alert('Нет изображений для скачивания.');
            return;
        }

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

    // Скачивание всех текстов админом
    downloadTextBtn.addEventListener('click', () => {
        const textUploads = uploads.filter(item => item.type === 'text');
        const texts = textUploads.map(item => `${item.user}: ${item.content}`).join('\n');

        if (texts.length === 0) {
            alert('Нет текстов для скачивания.');
            return;
        }

        const blob = new Blob([texts], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'texts.txt';
        a.click();
    });

    // Применение ограничений по количеству загрузок
    applyLimitsBtn.addEventListener('click', () => {
        photoLimit = parseInt(photoLimitInput.value);
        textLimit = parseInt(textLimitInput.value);
        alert(`Ограничения обновлены: Фото - ${photoLimit}, Тексты - ${textLimit}`);
    });

    // Инициализация данных из GitHub при загрузке страницы
    await loadUploads();
});
