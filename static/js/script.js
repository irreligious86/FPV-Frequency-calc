// import { sayHello } from './module1.js';
// import { calculateSomething } from './module2.js';

// sayHello();
// console.log(calculateSomething(5, 10));


import { getChannelsData } from './dataLoader.js';

async function init() {
    const channels = await getChannelsData();
    console.log("Используем данные:", channels);

    // Пример использования
    document.body.innerHTML += `<h2>Всего каналов: ${channels.length}</h2>`;
}

init();
